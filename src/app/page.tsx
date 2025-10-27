
"use client";

import { useState, useMemo, type ChangeEvent, type FC, type ReactNode, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Truck, Calculator, Scale, CircleDollarSign, Package, Minus, Plus, Save, History, Trash2, User, Wallet, Warehouse, Pencil, Download, LogIn, LogOut, RefreshCw, Share, Receipt, Image as ImageIcon, Boxes, Leaf, Languages, Tractor, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';
import { useAuth, signInWithGoogle, signOut } from '@/lib/firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import * as htmlToImage from 'html-to-image';
import { saveCalculation, getCalculations, type CalculationDB, deleteCalculation, updateCalculation } from '@/lib/firebase/firestore';
import Logo from '@/components/icons/Logo';
import { useI18n, type Locale } from '@/lib/i18n/i18n';
import { Cairo } from 'next/font/google';


const cairo = Cairo({
  weight: '700',
  subsets: ['arabic'],
});

type VegetableKey = 'tomato' | 'cucumber' | 'pepper' | 'pepper_kwach';

interface Vegetable {
    name: string;
    name_ar: string;
    name_en: string;
    weight: number;
    icon: string;
}

const vegetables: Record<VegetableKey, Vegetable> = {
    tomato: { name: 'Tomate', name_ar: 'طماطم', name_en: 'Tomato', weight: 31, icon: '🍅' },
    cucumber: { name: 'Concombre', name_ar: 'خيار', name_en: 'Cucumber', weight: 27, icon: '🥒' },
    pepper: { name: 'Poivron Ramos', name_ar: 'فلفل راموس', name_en: 'Ramos Pepper', weight: 15, icon: '🌶️' },
    pepper_kwach: { name: 'Poivron Coach', name_ar: 'فلفل كواتش', name_en: 'Coach Pepper', weight: 14, icon: '🌶️' },
};


interface InputFieldProps {
  id: string;
  label: string;
  value: number | string;
  setValue: (value: number | string) => void;
  unit: string;
  icon: ReactNode;
  step?: number;
  isBold?: boolean;
  isError?: boolean;
}

const InputField: FC<InputFieldProps> = ({ id, label, value, setValue, unit, icon, step = 1, isBold = false, isError = false }) => {
  const { direction } = useI18n();
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value === '' ? '' : Number(e.target.value));
  };

  const handleFocus = () => {
    if (Number(value) === 0) {
      setValue('');
    }
  };

  const handleBlur = () => {
    if (value === '') {
      setValue(0);
    }
  };
  
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={cn(`flex items-center gap-2 text-sm ${isBold ? 'font-bold' : ''}`, isError && "text-destructive")}>
        {icon}
        {label}
      </Label>
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          id={id}
          type="number"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0"
          className={cn(direction === 'rtl' ? 'pr-2' : 'pl-2', isError && "border-destructive ring-destructive ring-1")}
        />
         <div className={cn("absolute flex items-center", direction === 'rtl' ? 'left-3' : 'right-3')}>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  );
};

interface HistoryEntry extends CalculationDB {
  synced?: boolean;
}

const LanguageSwitcher = () => {
    const { locale, setLocale, direction, t } = useI18n();
    const languages: { code: Locale; name: string; flag: string }[] = [
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                    <Languages className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={direction === 'rtl' ? 'start' : 'end'} className="w-48">
                {languages.map((lang) => (
                    <DropdownMenuItem key={lang.code} onClick={() => setLocale(lang.code)} className={cn("cursor-pointer", locale === lang.code && 'bg-accent')}>
                        <span className="mr-3 text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


export default function CargoValuatorPage() {
  const { user, loading } = useAuth();
  const { t, locale, direction } = useI18n();
  const { toast } = useToast();

  const [mlihCrates, setMlihCrates] = useState<number | string>(0);
  const [dichiCrates, setDichiCrates] = useState<number | string>(0);
  const [grossWeight, setGrossWeight] = useState<number | string>(0);
  const emptyCrateWeight = 3;
  const [fullCrateWeight, setFullCrateWeight] = useState<number>(0);
  const [mlihPrice, setMlihPrice] = useState<number | string>(0);
  const [dichiPrice, setDichiPrice] = useState<number | string>(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const [clientName, setClientName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [remainingCrates, setRemainingCrates] = useState<number | string>('');
  const [remainingMoney, setRemainingMoney] = useState<number | string>('');
  const [mlihAgreedPrice, setMlihAgreedPrice] = useState<number | string>('');
  const [dichiAgreedPrice, setDichiAgreedPrice] = useState<number | string>('');


  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [errors, setErrors] = useState<{ grossWeight?: boolean; fullCrateWeight?: boolean }>({});
  const [selectedVegetable, setSelectedVegetable] = useState<VegetableKey | null>(null);

  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);

  const [isDistributeDialogOpen, setDistributeDialogOpen] = useState(false);
  const [distributeVirtualCrates, setDistributeVirtualCrates] = useState<number | string>('');

  const [farmFilter, setFarmFilter] = useState<string | null>(null);

  const hasSynced = useRef(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const sortHistory = useCallback((historyToSort: HistoryEntry[]) => {
    return historyToSort.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, []);

  const handleCalculate = () => {
    const newErrors: { grossWeight?: boolean; fullCrateWeight?: boolean } = {};
    if (Number(grossWeight) <= 0) {
      newErrors.grossWeight = true;
    }
    if (!selectedVegetable) {
      newErrors.fullCrateWeight = true;
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setShowResults(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      setShowResults(false);
    }
  };

  // Fetch data from Firestore in real-time or load from localStorage
  useEffect(() => {
    let unsubscribe = () => {};
    let itemsToSync: HistoryEntry[] = [];
    
    if (loading) return; // Wait until auth state is determined

    if (user) {
      // User is logged in, sync local data and listen to Firestore
      if (!hasSynced.current) {
        hasSynced.current = true;
        const localHistoryString = localStorage.getItem('cargoHistory_local');
        if (localHistoryString) {
          try {
            const localHistory: HistoryEntry[] = JSON.parse(localHistoryString);
            itemsToSync = localHistory.filter(item => !item.synced);

            if (itemsToSync.length > 0) {
              toast({ title: t('syncing_title'), description: t('syncing_desc', { count: itemsToSync.length }) });
              
              const syncPromises = itemsToSync.map(item => {
                const { id, synced, ...dataToSave } = item;
                return saveCalculation(user.uid, dataToSave as Omit<CalculationDB, 'id' | 'uid'>);
              });

              Promise.all(syncPromises)
                .then(() => {
                  // Wait for Firestore listener to update history before removing local
                })
                .catch(err => {
                   console.error("Failed to sync history", err);
                   toast({ variant: "destructive", title: t('sync_error_title'), description: t('sync_error_desc') });
                });
            }
          } catch (e) {
            console.error("Could not parse local history for sync", e);
          }
        }
      }

      // Listen for real-time updates from Firestore
      unsubscribe = getCalculations(user.uid, (firestoreHistory) => {
        setHistory(prevHistory => {
          const syncedFirestoreHistory = firestoreHistory.map(h => ({ ...h, synced: true }));
          
          // Filter local history to only include items not yet synced or without a definitive firestore id
          const localUnsynced = prevHistory.filter(h => !h.synced);
          
          const firestoreMap = new Map(syncedFirestoreHistory.map(h => [h.id, h]));
          const merged = [...syncedFirestoreHistory];
          
          // Add local items that are not in firestore yet
          localUnsynced.forEach(localItem => {
            if (!firestoreMap.has(localItem.id)) {
              merged.push(localItem);
            }
          });

          // After successful sync, we should clear the local storage.
          if (itemsToSync.length > 0) {
             const allSyncedNow = itemsToSync.every(localItem => firestoreHistory.some(fsItem => fsItem.date === localItem.date && fsItem.clientName === localItem.clientName)); // Imperfect but better
             if(allSyncedNow) localStorage.removeItem('cargoHistory_local');
          }


          return sortHistory(merged);
        });
      });

    } else { // Not logged in
      hasSynced.current = false;
      try {
        const savedHistory = localStorage.getItem('cargoHistory_local');
        if (savedHistory) {
          const parsedHistory: HistoryEntry[] = JSON.parse(savedHistory);
          const historyToSet = parsedHistory.map(item => ({...item, synced: false}));
          setHistory(sortHistory(historyToSet));
        } else {
          setHistory([]);
        }
      } catch (error) {
        console.error("Failed to load history from localStorage", error);
        setHistory([]);
      }
    }

    // Cleanup listener on unmount or user change
    return () => unsubscribe();
  }, [user, loading, toast, sortHistory, t]);


  // Save to localStorage when not logged in OR when there are unsynced items
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
        localStorage.setItem('cargoHistory_local', JSON.stringify(history));
    } else {
        const unsyncedItems = history.filter(item => !item.synced);
        if (unsyncedItems.length > 0) {
            localStorage.setItem('cargoHistory_local', JSON.stringify(unsyncedItems));
        } else {
            localStorage.removeItem('cargoHistory_local');
        }
    }
  }, [history, user, loading]);

  useEffect(() => {
    if (selectedVegetable) {
      setFullCrateWeight(vegetables[selectedVegetable].weight);
    } else {
      setFullCrateWeight(0);
    }
  }, [selectedVegetable]);
  

  const calculations = useMemo(() => {
    const mlihCratesNum = Number(mlihCrates) || 0;
    const dichiCratesNum = Number(dichiCrates) || 0;
    const grossWeightNum = Number(grossWeight) || 0;
    const fullCrateWeightNum = Number(fullCrateWeight) || 0;
    const mlihPriceNum = Number(mlihPrice) || 0;
    const dichiPriceNum = Number(dichiPrice) || 0;

    const totalCrates = mlihCratesNum + dichiCratesNum;
    const totalEmptyCratesWeight = totalCrates * emptyCrateWeight;
    const totalNetProductWeight = grossWeightNum > totalEmptyCratesWeight ? grossWeightNum - totalEmptyCratesWeight : 0;
    const averageNetWeightPerCrate = totalCrates > 0 ? totalNetProductWeight / totalCrates : 0;
    
    const netWeightMlih = mlihCratesNum * averageNetWeightPerCrate;
    const netWeightDichi = dichiCratesNum * averageNetWeightPerCrate;

    const virtualCratesMlih = fullCrateWeightNum > 0 ? netWeightMlih / fullCrateWeightNum : 0;
    const virtualCratesDichi = fullCrateWeightNum > 0 ? netWeightDichi / fullCrateWeightNum : 0;

    const totalPriceMlih = virtualCratesMlih * mlihPriceNum;
    const totalPriceDichi = virtualCratesDichi * dichiPriceNum;

    const grandTotalPrice = totalPriceMlih + totalPriceDichi;
    const grandTotalPriceRiyal = grandTotalPrice * 20;
    
    return {
      totalCrates,
      totalEmptyCratesWeight,
      totalNetProductWeight,
      averageNetWeightPerCrate,
      netWeightMlih,
      netWeightDichi,
      virtualCratesMlih,
      virtualCratesDichi,
      totalVirtualCrates: virtualCratesMlih + virtualCratesDichi,
      totalPriceMlih,
      totalPriceDichi,
      grandTotalPrice,
      grandTotalPriceRiyal
    };
  }, [mlihCrates, dichiCrates, grossWeight, fullCrateWeight, mlihPrice, dichiPrice]);

  const distributionCalculations = useMemo(() => {
    const virtualCrates = Number(distributeVirtualCrates) || 0;
    const fullCrateWeightNum = Number(fullCrateWeight) || 0;
    const averageNetWeightPerCrate = calculations.averageNetWeightPerCrate || 0;
    
    if (averageNetWeightPerCrate === 0) {
      return {
        grossCrates: 0,
        totalWeight: 0,
      };
    }

    const grossCrates = (fullCrateWeightNum * virtualCrates) / averageNetWeightPerCrate;
    const totalWeight = grossCrates * averageNetWeightPerCrate + grossCrates * emptyCrateWeight;

    return {
      grossCrates,
      totalWeight,
    };
  }, [distributeVirtualCrates, fullCrateWeight, calculations.averageNetWeightPerCrate]);


  const formatCurrency = (value: number, currency = 'MAD') => {
    if (isNaN(value)) value = 0;
    let localeString = locale === 'ar' ? 'ar-SA' : 'fr-MA';

    // Options to force Latin numerals
    const commonOptions: Intl.NumberFormatOptions = {
      numberingSystem: 'latn'
    };

    if (currency === 'Riyal') {
        const numberPart = new Intl.NumberFormat(localeString, commonOptions).format(value);
        return `${numberPart} ${t('currency_riyal')}`;
    }
    const options: Intl.NumberFormatOptions = { 
        style: 'currency', 
        currency, 
        currencyDisplay: 'code',
        ...commonOptions 
    };

    return new Intl.NumberFormat(localeString, options).format(value);
  }
  
  const handleSave = async () => {
    if (!selectedVegetable) {
      toast({ variant: "destructive", title: t('product_missing_title'), description: t('product_missing_desc') });
      return;
    }
    setSaveDialogOpen(false);
    
    const newEntryData: Omit<CalculationDB, 'id' | 'uid'> = {
      date: new Date().toLocaleString('fr-FR'),
      createdAt: new Date().toISOString(),
      productType: selectedVegetable,
      mlihPrice: Number(mlihPrice) || 0,
      dichiPrice: Number(dichiPrice) || 0,
      results: {
        grandTotalPrice: calculations.grandTotalPrice,
        grandTotalPriceRiyal: calculations.grandTotalPriceRiyal,
        totalNetWeight: calculations.totalNetProductWeight,
      },
      clientName: clientName,
      farm: farmName,
      remainingCrates: Number(remainingCrates) || 0,
      remainingMoney: Number(remainingMoney) || 0,
      totalCrates: calculations.totalCrates,
      mlihAgreedPrice: Number(mlihAgreedPrice) || 0,
      dichiAgreedPrice: Number(dichiAgreedPrice) || 0,
    };

    if (user && navigator.onLine) {
        try {
            await saveCalculation(user.uid, newEntryData);
            toast({ title: t('save_success_title'), description: t('save_success_desc') });
        } catch (error) {
            console.error("Failed to save online", error);
            toast({ variant: "destructive", title: t('save_fail_title'), description: t('save_fail_desc') });
        }
    } else {
        const localEntry: HistoryEntry = {
            ...newEntryData,
            id: Date.now().toString(),
            synced: false,
            uid: user?.uid || 'local'
        };
      setHistory(prev => sortHistory([localEntry, ...prev]));
      toast({ title: t('saved_locally_title'), description: user ? t('saved_locally_offline_desc') : t('saved_locally_guest_desc') });
    }
    
    setClientName('');
    setFarmName('');
    setRemainingCrates('');
    setRemainingMoney('');
    setMlihAgreedPrice('');
    setDichiAgreedPrice('');
  };
  
  const handleOpenSaveDialog = () => {
     if (!selectedVegetable) {
      toast({ variant: "destructive", title: t('product_missing_title'), description: t('product_missing_desc') });
      return;
    }
    setSaveDialogOpen(true);
  }

  const handleUpdate = async () => {
    if (!editingEntry) return;

    const entryToUpdate: HistoryEntry = {
        ...editingEntry,
        clientName: editingEntry.clientName,
        farm: editingEntry.farm,
        productType: editingEntry.productType,
        mlihPrice: Number(editingEntry.mlihPrice) || 0,
        dichiPrice: Number(editingEntry.dichiPrice) || 0,
        mlihAgreedPrice: Number(editingEntry.mlihAgreedPrice) || 0,
        dichiAgreedPrice: Number(editingEntry.dichiAgreedPrice) || 0,
        remainingCrates: Number(editingEntry.remainingCrates) || 0,
        remainingMoney: Number(editingEntry.remainingMoney) || 0,
    };

    const { id, synced, ...dataToUpdate } = entryToUpdate;

    setHistory(history.map(entry => entry.id === id ? entryToUpdate : entry));
    setEditingEntry(null);

    if (user && navigator.onLine && synced) {
        try {
            await updateCalculation(id, dataToUpdate);
            toast({ title: t('update_success_title'), description: t('update_success_desc') });
        } catch (error) {
            console.error("Failed to update calculation", error);
            toast({ variant: "destructive", title: t('update_fail_title'), description: t('update_fail_desc') });
        }
    } else {
      const updatedWithFlag = { ...entryToUpdate, synced: false };
      setHistory(history.map(entry => (entry.id === id ? updatedWithFlag : entry)));
      toast({ title: t('updated_locally_title'), description: t('updated_locally_desc') });
    }
  };


  const openEditDialog = (entry: HistoryEntry) => {
    setEditingEntry({ ...entry });
  };

  const handleDelete = async (id: string) => {
    if (typeof id !== 'string' || id === '') return;
  
    const entryToDelete = history.find(entry => entry.id === id);
    if (!entryToDelete) return;

    const originalHistory = [...history];
    setHistory(history.filter(entry => entry.id !== id));

    if (user && navigator.onLine && entryToDelete.synced) {
      try {
        await deleteCalculation(id);
        toast({ title: t('delete_success_title'), description: t('delete_success_desc') });
      } catch (error) {
        console.error("Failed to delete calculation from Firestore", error);
        toast({
          variant: "destructive",
          title: t('delete_fail_title'),
          description: t('delete_fail_desc'),
        });
        setHistory(originalHistory);
      }
    } else {
      toast({ title: t('deleted_locally_title'), description: t('deleted_locally_desc') });
    }
  };
  
  const clearHistory = () => {
     if(user && navigator.onLine){
        const syncedIds = history.filter(h => h.synced).map(h => h.id);
        if (syncedIds.length > 0) {
            const deletePromises = syncedIds.map(id => deleteCalculation(id));
            Promise.all(deletePromises)
                .then(() => toast({ title: t('clear_history_cloud_success_title'), description: t('clear_history_cloud_success_desc') }))
                .catch(err => {
                    console.error("Failed to clear history from Firestore", err);
                    toast({ variant: "destructive", title: t('clear_history_cloud_fail_title'), description: t('clear_history_cloud_fail_desc') });
                });
        }
    } 
    
    setHistory(history.filter(h => !h.synced)); // Keep unsynced items if any
    localStorage.removeItem('cargoHistory_local');
    toast({ title: t('clear_history_local_title') });
  };

  interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: UserOptions) => jsPDFWithAutoTable;
  }

  const farmNames = useMemo(() => {
    const names = new Set(history.map(item => item.farm).filter(Boolean));
    return Array.from(names);
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (!farmFilter) {
      return history;
    }
    return history.filter(item => item.farm === farmFilter);
  }, [history, farmFilter]);

  const downloadHistory = async () => {
    const historyToDownload = filteredHistory;

    if (historyToDownload.length === 0) {
        toast({ variant: 'destructive', title: t('history_empty') });
        return;
    }

    const doc = new jsPDF({ orientation: 'landscape' }) as jsPDFWithAutoTable;
    const isArabic = locale === 'ar';

    try {
        if (isArabic) {
            const fontUrl = 'https://fonts.gstatic.com/s/arefruqaa/v26/W_h3E2_66G8J-kI9v-u_8w_SJw.ttf';
            const response = await fetch(fontUrl);
            if (!response.ok) throw new Error('Font fetch failed');
            const fontBuffer = await response.arrayBuffer();
            const fontBase64 = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(fontBuffer))));

            doc.addFileToVFS('ArefRuqaa-Regular.ttf', fontBase64);
            doc.addFont('ArefRuqaa-Regular.ttf', 'Aref Ruqaa', 'normal');
            doc.setFont('Aref Ruqaa');
        }
        
        doc.setFontSize(20);
        doc.setTextColor(40);
        const title = farmFilter ? `${t('pdf_report_title')} - ${farmFilter}` : t('pdf_report_title');
        const titleX = isArabic ? (doc.internal.pageSize.getWidth() - doc.getTextWidth(title) - 14) : 14;
        doc.text(title, titleX, 15);
        
        const totalCalculations = historyToDownload.length;
        const totalNetWeight = historyToDownload.reduce((sum, item) => sum + item.results.totalNetWeight, 0);
        const totalCrates = historyToDownload.reduce((sum, item) => sum + item.totalCrates, 0);
        const totalAgreedMlih = historyToDownload.reduce((sum, item) => sum + (item.mlihAgreedPrice || 0), 0);
        const totalAgreedDichi = historyToDownload.reduce((sum, item) => sum + (item.dichiAgreedPrice || 0), 0);
        const totalRemainingCrates = historyToDownload.reduce((sum, item) => sum + (item.remainingCrates || 0), 0);
        const totalRemainingMoney = historyToDownload.reduce((sum, item) => sum + (item.remainingMoney || 0), 0);

        const kpiBody = [
            [t('pdf_kpi_total_calcs'), totalCalculations.toString()],
            [t('pdf_kpi_total_net_weight'), `${totalNetWeight.toFixed(2)} kg`],
            [t('pdf_kpi_total_crates'), totalCrates.toString()],
            [t('pdf_kpi_total_agreed_mlih'), formatCurrency(totalAgreedMlih, 'MAD')],
            [t('pdf_kpi_total_agreed_dichi'), formatCurrency(totalAgreedDichi, 'MAD')],
            [t('pdf_kpi_total_remaining_crates'), totalRemainingCrates.toString()],
            [t('pdf_kpi_total_remaining_money'), formatCurrency(totalRemainingMoney, 'MAD')],
        ];
        if (isArabic) {
          kpiBody.forEach(row => row.reverse());
        }

        doc.autoTable({
            body: kpiBody,
            startY: 25,
            theme: 'plain',
            styles: {
                font: isArabic ? 'Aref Ruqaa' : 'Helvetica',
                halign: isArabic ? 'right' : 'left',
                fontSize: 10,
            },
            columnStyles: {
                0: { fontStyle: 'bold' }
            },
        });

        const finalY = doc.autoTable.previous.finalY;
        doc.setFontSize(14);
        const historyTitle = t('pdf_history_title');
        const historyTitleX = isArabic ? (doc.internal.pageSize.getWidth() - doc.getTextWidth(historyTitle) - 14) : 14;
        doc.text(historyTitle, historyTitleX, finalY + 15);

        const head = [[
            t('pdf_col_date'),
            t('pdf_col_client'),
            t('pdf_col_farm'),
            t('pdf_col_product'),
            t('pdf_col_agreed_price_mlih'),
            t('pdf_col_agreed_price_dichi'),
            t('pdf_col_selling_price'),
            t('pdf_col_total_crates'),
            t('pdf_col_net_weight'),
            t('pdf_col_remaining_crates'),
            t('pdf_col_remaining_money'),
        ]];

        const body = historyToDownload.map(item => {
            const product = item.productType ? (vegetables[item.productType as VegetableKey]?.[`name_${locale}` as keyof Vegetable] ?? vegetables[item.productType as VegetableKey]?.name) : 'N/A';
            return [
                item.date.split(' ')[0],
                item.clientName,
                item.farm || '-',
                formatCurrency(item.mlihAgreedPrice || 0),
                formatCurrency(item.dichiAgreedPrice || 0),
                `${item.mlihPrice || 0}/${item.dichiPrice || 0}`,
                item.totalCrates,
                item.results.totalNetWeight.toFixed(2),
                item.remainingCrates || 0,
                formatCurrency(item.remainingMoney || 0),
            ];
        });

        if (isArabic) {
            head[0].reverse();
            body.forEach(row => row.reverse());
        }

        doc.autoTable({
            head: head,
            body: body,
            startY: finalY + 20,
            styles: {
                font: isArabic ? 'Aref Ruqaa' : 'Helvetica',
                halign: isArabic ? 'right' : 'left',
                fontSize: 8,
            },
            headStyles: {
                fontStyle: 'bold',
                fillColor: [3, 169, 115]
            },
        });

        const formattedDate = new Date().toISOString().slice(0, 10);
        doc.save(`rapport_cargo_${farmFilter || 'tout'}_${formattedDate}.pdf`);

    } catch (error) {
        console.error('Oops, something went wrong with PDF generation!', error);
        toast({ variant: "destructive", title: t('error'), description: t('pdf_generation_fail') });
    }
  };


  const downloadHistoryItemAsImage = (id: string | number, clientName: string) => {
    const element = document.getElementById(`history-item-${id}`);
    if (element) {
        htmlToImage.toPng(element, { 
          backgroundColor: '#F0F4F0',
          fontEmbedCSS: `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&family=Cairo:wght@400;700&display=swap');
          `
        })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `calcul_${clientName.replace(' ', '_')}_${new Date().toISOString().slice(0, 10)}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((error) => {
                console.error('oops, something went wrong!', error);
                toast({ variant: "destructive", title: t('error'), description: t('image_generation_fail') });
            });
    }
  };

  const AuthArea = () => {
    if (loading) {
      return <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-full"></div>;
    }

    if (user) {
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={(user as any).photoURL || undefined} alt={(user as any).displayName || 'Avatar'} />
            <AvatarFallback>{(user as any).displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={signOut} className="rounded-full">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    
    return (
        <Button variant="default" size="icon" onClick={signInWithGoogle} className="rounded-full bg-primary hover:bg-primary/90">
            <LogIn className="h-5 w-5" />
        </Button>
    );
  };


  return (
    <main className="min-h-screen bg-background p-2 sm:p-4 md:p-6" dir={direction}>
      <div className="max-w-7xl mx-auto">
        <header className="relative flex items-center justify-center text-center mb-4 md:mb-6 pt-2 pb-2">
            <div className="absolute top-2 left-2 z-10">
                <LanguageSwitcher />
            </div>
        
            <div className="flex flex-col items-center">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-headline flex items-center gap-3">
                    {locale === 'ar' ? (
                        <>
                            <span>{t('app_title')}</span>
                            <Truck className="w-8 h-8 text-primary" />
                        </>
                    ) : (
                        <>
                            <Truck className="w-8 h-8 text-primary" />
                            <span>{t('app_title')}</span>
                        </>
                    )}
                </h1>
                <p className={cn("mt-1 text-sm text-muted-foreground", locale === 'ar' && cairo.className)}>
                    {t('app_subtitle')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground px-4">
                    {t('cargo_data_desc')}
                </p>
            </div>
            
            <div className="absolute top-2 right-2 z-10">
                <AuthArea />
            </div>
        </header>


        <div className="grid md:grid-cols-5 gap-4 md:gap-6">
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className={cn("text-lg sm:text-xl font-bold", locale === 'ar' && cairo.className)}>{t('cargo_data_title')}</CardTitle>
                <CardDescription>{t('cargo_data_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:gap-5">
                <div className="grid grid-cols-2 gap-4">
                    <InputField
                        id="grossWeight"
                        label={t('gross_weight_label')}
                        value={grossWeight}
                        setValue={setGrossWeight}
                        unit="kg"
                        icon={<Truck className="w-4 h-4 text-primary" />}
                        step={10}
                        isBold
                        isError={errors.grossWeight}
                    />
                    <div className="grid gap-2">
                        <Label className={cn("flex items-center gap-2 text-sm font-bold", errors.fullCrateWeight && "text-destructive")}>
                            <Scale className="w-4 h-4 text-primary" />
                            {t('product_type_label')}
                        </Label>
                        <Select onValueChange={(value: VegetableKey) => setSelectedVegetable(value)} value={selectedVegetable || undefined}>
                          <SelectTrigger className={cn("text-base", errors.fullCrateWeight && "border-destructive ring-destructive ring-1")}>
                            <SelectValue placeholder={t('product_type_placeholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(vegetables) as Array<keyof typeof vegetables>).map((key) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{vegetables[key].icon}</span>
                                    <span>{vegetables[key][`name_${locale}` as keyof Vegetable] ?? vegetables[key].name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.fullCrateWeight && <p className="text-xs text-destructive">{t('required_field')}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    id="mlihCrates"
                    label={t('mlih_crates_label')}
                    value={mlihCrates}
                    setValue={setMlihCrates}
                    unit={t('crates_unit')}
                    icon={<Package className="w-4 h-4 text-primary" />}
                    isBold
                  />
                  <InputField
                    id="dichiCrates"
                    label={t('dichi_crates_label')}
                    value={dichiCrates}
                    setValue={setDichiCrates}
                    unit={t('crates_unit')}
                    icon={<Package className="w-4 h-4 text-primary" />}
                    isBold
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    id="mlihPrice"
                    label={t('mlih_price_label')}
                    value={mlihPrice}
                    setValue={setMlihPrice}
                    unit={t('currency_dh')}
                    icon={<CircleDollarSign className="w-4 h-4 text-primary" />}
                    step={5}
                    isBold
                  />

                  <InputField
                    id="dichiPrice"
                    label={t('dichi_price_label')}
                    value={dichiPrice}
                    setValue={setDichiPrice}
                    unit={t('currency_dh')}
                    icon={<CircleDollarSign className="w-4 h-4 text-primary" />}
                    step={5}
                    isBold
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleCalculate}>
                  <Calculator className="mr-2 h-4 w-4" /> {t('calculate_button')}
                </Button>
              </CardFooter>
            </Card>
          </div>
          {showResults && (
            <div className="md:col-span-3" ref={resultsRef}>
              <Card className="shadow-lg h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className={cn("text-lg sm:text-xl", locale === 'ar' && cairo.className)}>{t('calculation_summary_title')}</CardTitle>
                    <CardDescription>{t('calculation_summary_desc')}</CardDescription>
                  </div>
                  <Dialog open={isDistributeDialogOpen} onOpenChange={setDistributeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="default" className={cn("font-bold", locale === 'ar' && cairo.className)}>
                        <Share className="mr-2 h-4 w-4" /> {t('distribute_button')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className={cn(locale === 'ar' && cairo.className)}>{t('distribute_dialog_title')}</DialogTitle>
                        <DialogDescription>
                          {t('distribute_dialog_desc')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="distributeVirtualCrates" className={cn("text-right font-bold", locale === 'ar' && cairo.className)}>{t('virtual_crates_label')}</Label>
                            <Input
                                id="distributeVirtualCrates"
                                type="number"
                                value={distributeVirtualCrates}
                                onChange={(e) => setDistributeVirtualCrates(e.target.value)}
                                className="col-span-3"
                                placeholder={t('example_placeholder', {value: 20})}
                            />
                        </div>
                        <Separator />
                        <div className="space-y-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('gross_crates_to_give')}</p>
                                <p className="text-2xl font-bold">{distributionCalculations.grossCrates.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t('corresponding_total_weight')}</p>
                                <p className="text-2xl font-bold">{distributionCalculations.totalWeight.toFixed(2)} kg</p>
                            </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">{t('close_button')}</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-center">
                      <div className="bg-secondary/50 p-2 sm:p-3 rounded-lg">
                          <p className={cn("text-xs text-muted-foreground font-bold", locale === 'ar' && cairo.className)}>{t('virtual_crates_label')}</p>
                          <p className="text-base sm:text-lg font-bold">{calculations.totalVirtualCrates.toFixed(2)}</p>
                      </div>
                      <div className="bg-secondary/50 p-2 sm:p-3 rounded-lg">
                          <p className={cn("text-xs text-muted-foreground font-bold", locale === 'ar' && cairo.className)}>{t('mlih_free_label')}</p>
                          <p className="text-base sm:text-lg font-bold">{calculations.virtualCratesMlih.toFixed(2)}</p>
                      </div>
                      <div className="bg-secondary/50 p-2 sm:p-3 rounded-lg">
                          <p className={cn("text-xs text-muted-foreground font-bold", locale === 'ar' && cairo.className)}>{t('dichi_free_label')}</p>
                          <p className="text-base sm:text-lg font-bold">{calculations.virtualCratesDichi.toFixed(2)}</p>
                      </div>
                  </div>

                  <div className="overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[150px] sm:w-[200px] font-bold">{t('category_label')}</TableHead>
                                  <TableHead className={cn("text-center font-bold", locale === 'ar' && cairo.className)}>{t('mlih_label')}</TableHead>
                                  <TableHead className={cn("text-center font-bold", locale === 'ar' && cairo.className)}>{t('dichi_label')}</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              <TableRow>
                                  <TableCell className="font-medium flex items-center gap-2 text-xs sm:text-sm"><Scale className="w-4 h-4 text-primary"/>{t('net_weight_label')} (kg)</TableCell>
                                  <TableCell className="text-center text-xs sm:text-sm">{calculations.netWeightMlih.toFixed(2)}</TableCell>
                                  <TableCell className="text-center text-xs sm:text-sm">{calculations.netWeightDichi.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow>
                                  <TableCell className={cn("font-bold flex items-center gap-2 text-xs sm:text-sm", locale === 'ar' && cairo.className)}><Calculator className="w-4 h-4 text-primary"/>{t('virtual_crates_label')}</TableCell>
                                  <TableCell className="text-center font-bold text-xs sm:text-sm">{calculations.virtualCratesMlih.toFixed(2)}</TableCell>
                                  <TableCell className="text-center font-bold text-xs sm:text-sm">{calculations.virtualCratesDichi.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow className="bg-primary/10">
                                  <TableCell className="font-semibold flex items-center gap-2 text-xs sm:text-sm"><CircleDollarSign className="w-4 h-4 text-primary"/>{t('total_price_label')} ({t('currency_dh')})</TableCell>
                                  <TableCell className="text-center font-bold text-xs sm:text-sm">{formatCurrency(calculations.totalPriceMlih)}</TableCell>
                                  <TableCell className="text-center font-bold text-xs sm:text-sm">{formatCurrency(calculations.totalPriceDichi)}</TableCell>
                              </TableRow>
                          </TableBody>
                      </Table>
                  </div>
                </CardContent>
                <CardFooter className="mt-auto flex flex-col gap-3">
                  <div className="w-full bg-accent text-accent-foreground p-3 rounded-lg flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold">{t('grand_total_price_label')}</span>
                      <span className="text-lg sm:text-xl font-extrabold">{formatCurrency(calculations.grandTotalPrice)}</span>
                  </div>
                  <div className="w-full bg-secondary text-secondary-foreground p-3 rounded-lg flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold">{t('total_price_riyal_label')}</span>
                      <span className="text-lg sm:text-xl font-extrabold">{formatCurrency(calculations.grandTotalPriceRiyal, 'Riyal')}</span>
                  </div>
                     <Dialog open={isSaveDialogOpen} onOpenChange={setSaveDialogOpen}>
                        <DialogTrigger asChild>
                           <Button className="w-full" onClick={handleOpenSaveDialog}>
                            <Save className="mr-2 h-4 w-4" /> {t('save_button')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className={cn(locale === 'ar' && cairo.className)}>{t('save_details_title')}</DialogTitle>
                            <DialogDescription>
                              {t('save_details_desc')}
                              { !user && ` ${t('login_to_sync')}`}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="clientName" className="text-right">{t('client_name_label')}</Label>
                              <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="farmName" className="text-right">{t('farm_name_label')}</Label>
                              <Input id="farmName" value={farmName} onChange={(e) => setFarmName(e.target.value)} className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label className={cn("text-right col-span-1", locale === 'ar' && cairo.className)}>
                                    {t('agreed_price_label')}
                                </Label>
                                <div className="col-span-3 grid grid-cols-2 gap-2">
                                  <Input 
                                      id="mlihAgreedPrice" 
                                      type="number"
                                      placeholder={t('mlih_label')}
                                      value={mlihAgreedPrice}
                                      onChange={(e) => setMlihAgreedPrice(e.target.value)} 
                                  />
                                  <Input 
                                      id="dichiAgreedPrice" 
                                      type="number" 
                                      placeholder={t('dichi_label')}
                                      value={dichiAgreedPrice}
                                      onChange={(e) => setDichiAgreedPrice(e.target.value)} 
                                  />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="remainingCrates" className={cn("text-right font-bold", locale === 'ar' && cairo.className)}>{t('remaining_crates_label')}</Label>
                               <Input 
                                    id="remainingCrates" 
                                    type="number" 
                                    value={remainingCrates}
                                    onChange={(e) => setRemainingCrates(e.target.value)}
                                    className="col-span-3" 
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="remainingMoney" className="text-right">{t('remaining_money_label')}</Label>
                               <Input 
                                    id="remainingMoney" 
                                    type="number" 
                                    value={remainingMoney}
                                    onChange={(e) => setRemainingMoney(e.target.value)} 
                                    className="col-span-3" 
                                />
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">{t('cancel_button')}</Button>
                            </DialogClose>
                            <Button onClick={handleSave}>{t('save_button')}</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                </CardFooter>
              </Card>
            </div>
          )}

          <div className="md:col-span-5 mt-4 md:mt-6">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-1.5">
                  <CardTitle className={cn("text-lg sm:text-xl font-bold flex items-center gap-2", locale === 'ar' && cairo.className)}>
                    <History className="w-5 h-5" />
                    {t('history_title')}
                  </CardTitle>
                  <CardDescription>
                    {user ? t('history_desc_online') : t('history_desc_offline')}
                  </CardDescription>
                </div>
                {history.length > 0 && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                     {history.some(item => !item.synced) && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>{t('unsynced_label')}</span>
                        </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="mr-1 h-3 w-3" />
                          {farmFilter ? `${t('filtering_by_label')}: ${farmFilter}` : t('filter_by_farm_label')}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setFarmFilter(null)}>{t('all_farms_label')}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {farmNames.map(name => (
                          <DropdownMenuItem key={name} onClick={() => setFarmFilter(name)}>
                            {name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={downloadHistory}>
                      <Download className="mr-1 h-3 w-3" /> {t('download_button')}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={clearHistory}>
                      <Trash2 className="mr-1 h-3 w-3" /> {t('clear_button')}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent ref={historyRef}>
                <ScrollArea className="h-[420px] pr-3">
                {filteredHistory.length > 0 ? (
                    <div className="space-y-4">
                      {filteredHistory.map((item) => {
                        const product = item.productType ? vegetables[item.productType as VegetableKey] : null;
                        return (
                          <div key={item.id} id={`history-item-${item.id}`} className="p-3 bg-secondary/50 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                     <p className="text-xs text-muted-foreground">{item.date}</p>
                                     {!item.synced && <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" title={t('unsynced_label')}/>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <p className="font-bold text-sm flex items-center gap-1"><User className="w-3 h-3"/>{item.clientName}</p>
                                     {item.farm && <p className="text-sm flex items-center gap-1"><Tractor className="w-3 h-3"/>{item.farm}</p>}
                                     {product && (
                                      <p className="text-sm flex items-center gap-1">
                                        <span className="text-base">{product.icon}</span>
                                        <span className="text-xs text-muted-foreground">{product[`name_${locale}` as keyof Vegetable] ?? product.name}</span>
                                      </p>
                                     )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 -mr-2 -mt-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => downloadHistoryItemAsImage(item.id, item.clientName)}>
                                    <ImageIcon className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => openEditDialog(item)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-destructive" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                            </div>
                            <Separator className="my-2" />
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                                  <div className="flex justify-between items-center col-span-2">
                                      <p className="font-bold flex items-center gap-1"><Receipt className="w-3 h-3"/>{t('agreed_price_label')} ({t('mlih_label')}/{t('dichi_label')}):</p>
                                      <p className="font-bold">{formatCurrency(item.mlihAgreedPrice || 0)} / {formatCurrency(item.dichiAgreedPrice || 0)}</p>
                                  </div>
                                  <div className="flex justify-between items-center col-span-2">
                                      <p className="font-bold flex items-center gap-1"><CircleDollarSign className="w-3 h-3"/>{t('selling_price_label')} ({t('mlih_label')}/{t('dichi_label')}):</p>
                                      <p className="font-bold">{item.mlihPrice || 0} {t('currency_dh')} / {item.dichiPrice || 0} {t('currency_dh')}</p>
                                  </div>
                                  <div className="flex justify-between items-center col-span-2">
                                      <span className="font-bold flex items-center gap-1"><Scale className="w-3 h-3"/>{t('total_net_weight_label')} (kg):</span>
                                      <span className="font-bold">{(item.results.totalNetWeight?.toFixed(2) || 'N/A') + ' kg'}</span>
                                  </div>
                                   <div className="flex justify-between items-center col-span-2">
                                      <p className="font-bold flex items-center gap-1"><Package className="w-3 h-3"/>{t('total_crates_label')}:</p>
                                      <p className="font-bold">{item.totalCrates}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <Separator className="my-1" />
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <span className="font-bold flex items-center gap-1"><Warehouse className="w-3 h-3"/>{t('remaining_crates_label')}:</span>
                                      <span className="font-bold">{item.remainingCrates}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <span className="font-bold flex items-center gap-1"><Wallet className="w-3 h-3"/>{t('remaining_money_label')}:</span>
                                      <span className="font-bold">{formatCurrency(item.remainingMoney)}</span>
                                  </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center pt-10">{t('no_calculations_saved')}</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Edit Dialog */}
        <Dialog open={!!editingEntry} onOpenChange={(isOpen) => !isOpen && setEditingEntry(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className={cn(locale === 'ar' && cairo.className)}>{t('edit_history_entry_title')}</DialogTitle>
                    <DialogDescription>
                        {t('edit_history_entry_desc')}
                    </DialogDescription>
                </DialogHeader>
                {editingEntry && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editClientName" className="text-right">{t('client_name_label')}</Label>
                            <Input 
                                id="editClientName" 
                                value={editingEntry.clientName} 
                                onChange={(e) => setEditingEntry({ ...editingEntry, clientName: e.target.value })}
                                className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editFarmName" className="text-right">{t('farm_name_label')}</Label>
                            <Input 
                                id="editFarmName" 
                                value={editingEntry.farm} 
                                onChange={(e) => setEditingEntry({ ...editingEntry, farm: e.target.value })}
                                className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">{t('product_type_label')}</Label>
                          <div className="col-span-3">
                             <Select 
                                onValueChange={(value: VegetableKey) => setEditingEntry({ ...editingEntry, productType: value })} 
                                value={editingEntry.productType as VegetableKey || undefined}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('product_type_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Object.keys(vegetables) as Array<keyof typeof vegetables>).map((key) => (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center gap-2">
                                          <span className="text-xl">{vegetables[key].icon}</span>
                                          <span>{vegetables[key][`name_${locale}` as keyof Vegetable] ?? vegetables[key].name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                          </div>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editMlihPrice" className="text-right">{t('mlih_price_label')}</Label>
                            <Input 
                                id="editMlihPrice" 
                                type="number" 
                                value={editingEntry.mlihPrice} 
                                onChange={(e) => setEditingEntry(prev => prev ? { ...prev, mlihPrice: e.target.value === '' ? '' : Number(e.target.value) } : null)}
                                className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editDichiPrice" className="text-right">{t('dichi_price_label')}</Label>
                            <Input 
                                id="editDichiPrice" 
                                type="number" 
                                value={editingEntry.dichiPrice} 
                                onChange={(e) => setEditingEntry(prev => prev ? { ...prev, dichiPrice: e.target.value === '' ? '' : Number(e.target.value) } : null)}
                                className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className={cn("text-right col-span-1", locale === 'ar' && cairo.className)}>
                                {t('agreed_price_label')}
                            </Label>
                            <div className="col-span-3 grid grid-cols-2 gap-2">
                                <Input 
                                    id="editMlihAgreedPrice" 
                                    type="number" 
                                    placeholder={t('mlih_label')}
                                    value={editingEntry.mlihAgreedPrice} 
                                    onChange={(e) => setEditingEntry(prev => prev ? { ...prev, mlihAgreedPrice: e.target.value === '' ? '' : Number(e.target.value) } : null)}
                                />
                                <Input 
                                    id="editDichiAgreedPrice" 
                                    type="number" 
                                    placeholder={t('dichi_label')}
                                    value={editingEntry.dichiAgreedPrice} 
                                    onChange={(e) => setEditingEntry(prev => prev ? { ...prev, dichiAgreedPrice: e.target.value === '' ? '' : Number(e.target.value) } : null)}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editRemainingCrates" className={cn("text-right font-bold", locale === 'ar' && cairo.className)}>{t('remaining_crates_label')}</Label>
                            <Input 
                                id="editRemainingCrates" 
                                type="number" 
                                value={editingEntry.remainingCrates} 
                                onChange={(e) => setEditingEntry(prev => prev ? { ...prev, remainingCrates: e.target.value === '' ? '' : Number(e.target.value) } : null)}
                                className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editRemainingMoney" className="text-right">{t('remaining_money_label')}</Label>                            
                            <Input 
                                id="editRemainingMoney" 
                                type="number" 
                                value={editingEntry.remainingMoney} 
                                onChange={(e) => setEditingEntry(prev => prev ? { ...prev, remainingMoney: e.target.value === '' ? '' : Number(e.target.value) } : null)}
                                className="col-span-3" />
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingEntry(null)}>{t('cancel_button')}</Button>
                    <Button onClick={handleUpdate}>{t('save_changes_button')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}



