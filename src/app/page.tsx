
"use client";

import { useState, useMemo, type ChangeEvent, type FC, type ReactNode, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Boxes, Calculator, Scale, CircleDollarSign, Package, Truck, Minus, Plus, Save, History, Trash2, User, Wallet, Warehouse, Pencil, Download, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Aref_Ruqaa } from 'next/font/google';
import { useAuth, signInWithGoogle, signOut } from '@/lib/firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { saveCalculation, type CalculationInput } from '@/ai/flows/saveCalculationFlow';
import { useToast } from '@/hooks/use-toast';


const arefRuqaa = Aref_Ruqaa({
  weight: '700',
  subsets: ['latin'],
});

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
          className={cn("pr-16", isError && "border-destructive ring-destructive ring-1")}
        />
        <div className="absolute right-0 flex items-center pr-3">
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      </div>
    </div>
  );
};

interface HistoryEntry {
  id: number;
  date: string;
  results: {
    grandTotalPrice: number;
    grandTotalPriceRiyal: number;
  };
  clientName: string;
  remainingCrates: number;
  remainingMoney: number;
  totalCrates: number;
  synced?: boolean;
}


export default function CargoValuatorPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [mlihCrates, setMlihCrates] = useState<number | string>(0);
  const [dichiCrates, setDichiCrates] = useState<number | string>(0);
  const [grossWeight, setGrossWeight] = useState<number | string>(0);
  const emptyCrateWeight = 3;
  const [fullCrateWeight, setFullCrateWeight] = useState<number | string>(0);
  const [mlihPrice, setMlihPrice] = useState<number | string>(0);
  const [dichiPrice, setDichiPrice] = useState<number | string>(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const [clientName, setClientName] = useState('');
  const [remainingCrates, setRemainingCrates] = useState<number | string>('');
  const [remainingMoney, setRemainingMoney] = useState<number | string>('');
  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [errors, setErrors] = useState<{ grossWeight?: boolean; fullCrateWeight?: boolean }>({});

  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);
  
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('cargoHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cargoHistory', JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [history]);
  
  useEffect(() => {
    const syncOfflineData = async () => {
      if (user && navigator.onLine) {
        const offlineEntries = history.filter(entry => !entry.synced);
        if (offlineEntries.length > 0) {
          console.log(`Syncing ${offlineEntries.length} offline entries...`);
          const syncPromises = offlineEntries.map(async (entry) => {
            const input: CalculationInput = {
              uid: user.uid,
              date: entry.date,
              results: entry.results,
              clientName: entry.clientName,
              remainingCrates: entry.remainingCrates,
              remainingMoney: entry.remainingMoney,
              totalCrates: entry.totalCrates,
            };
            const result = await saveCalculation(input);
            if (result.success) {
              return { ...entry, synced: true };
            }
            return entry; // Keep as unsynced if save fails
          });

          const syncedResults = await Promise.all(syncPromises);
          
          setHistory(prevHistory => {
            const newHistory = [...prevHistory];
            syncedResults.forEach(syncedEntry => {
              const index = newHistory.findIndex(h => h.id === syncedEntry.id);
              if (index !== -1 && syncedEntry.synced) {
                newHistory[index] = syncedEntry;
              }
            });
            return newHistory;
          });
          toast({ title: "Synchronisation terminée", description: `${offlineEntries.length} calculs ont été synchronisés.` });
        }
      }
    };

    syncOfflineData();
    
    window.addEventListener('online', syncOfflineData);
    return () => {
        window.removeEventListener('online', syncOfflineData);
    }

  }, [user, history, toast]);

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

  const formatCurrency = (value: number, currency = 'MAD') => {
    const options: Intl.NumberFormatOptions = { style: 'currency', currency, currencyDisplay: 'code' };
    let locale = 'fr-MA';
    
    if (currency === 'Riyal') {
        const numberPart = new Intl.NumberFormat('fr-MA').format(value);
        return `${numberPart} Riyal`;
    }

    return new Intl.NumberFormat(locale, options).format(value);
  }
  
  const handleSave = async () => {
    const newEntryData = {
      id: Date.now(),
      date: new Date().toLocaleString('fr-FR'),
      results: {
        grandTotalPrice: calculations.grandTotalPrice,
        grandTotalPriceRiyal: calculations.grandTotalPriceRiyal,
      },
      clientName: clientName,
      remainingCrates: Number(remainingCrates) || 0,
      remainingMoney: Number(remainingMoney) || 0,
      totalCrates: calculations.totalCrates
    };

    if (user && navigator.onLine) {
      try {
        const input: CalculationInput = {
          uid: user.uid,
          date: newEntryData.date,
          results: newEntryData.results,
          clientName: newEntryData.clientName,
          remainingCrates: newEntryData.remainingCrates,
          remainingMoney: newEntryData.remainingMoney,
          totalCrates: newEntryData.totalCrates,
        };
        const result = await saveCalculation(input);
        if (result.success) {
          setHistory([{ ...newEntryData, synced: true }, ...history]);
          toast({ title: "Succès", description: "Le calcul a été enregistré et synchronisé." });
        } else {
          throw new Error("Failed to save to Firestore");
        }
      } catch (error) {
        console.error("Failed to save online, saving locally", error);
        setHistory([{ ...newEntryData, synced: false }, ...history]);
        toast({ variant: "destructive", title: "Erreur de synchronisation", description: "Le calcul est sauvegardé localement." });
      }
    } else {
      setHistory([{ ...newEntryData, synced: false }, ...history]);
      toast({ title: "Sauvegardé localement", description: "Connectez-vous pour synchroniser le calcul." });
    }
    
    setClientName('');
    setRemainingCrates('');
    setRemainingMoney('');
    setSaveDialogOpen(false);
  };
  
  const handleOpenSaveDialog = () => {
    setSaveDialogOpen(true);
  }

  const handleUpdate = () => {
    if (!editingEntry) return;

    setHistory(history.map(entry => 
        entry.id === editingEntry.id ? { ...entry, clientName: editingEntry.clientName, remainingCrates: editingEntry.remainingCrates, remainingMoney: editingEntry.remainingMoney } : entry
    ));
    setEditingEntry(null);
  };

  const openEditDialog = (entry: HistoryEntry) => {
    setEditingEntry({ ...entry });
  };

  const handleDelete = (id: number) => {
    setHistory(history.filter(entry => entry.id !== id));
  };
  
  const handleCalculate = () => {
    const grossWeightNum = Number(grossWeight) || 0;
    const fullCrateWeightNum = Number(fullCrateWeight) || 0;
    const newErrors: { grossWeight?: boolean; fullCrateWeight?: boolean } = {};

    if (grossWeightNum <= 0) {
      newErrors.grossWeight = true;
    }
    if (fullCrateWeightNum <= 0) {
      newErrors.fullCrateWeight = true;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };
  
  const clearHistory = () => {
    setHistory([]);
  };

  const downloadHistory = async () => {
    if (history.length === 0) {
        alert("L'historique est vide.");
        return;
    }

    const doc = new jsPDF();
    
    doc.setFont('helvetica');

    doc.text("Historique des Calculs", 14, 16);

    const head = [
        ["Date", "Nom du client", "Prix Total (Riyal)", "مجموع الصندوق", "الصندوق الباقي", "Reste d'argent (MAD)"]
    ];

    const body = history.map(item => [
        String(item.date),
        String(item.clientName),
        String(item.results.grandTotalPriceRiyal.toFixed(2)),
        String(item.totalCrates),
        String(item.remainingCrates),
        String(item.remainingMoney.toFixed(2))
    ]);

    autoTable(doc, {
        head: head,
        body: body,
        startY: 20,
        styles: { halign: 'center' },
        headStyles: { halign: 'center', fontStyle: 'bold' },
        columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'left' },
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'right' },
        },
    });

    const formattedDate = new Date().toISOString().slice(0, 10);
    doc.save(`historique_cargo_${formattedDate}.pdf`);
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
    <main className="min-h-screen bg-background p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-4 md:mb-6">
           <div className="flex-1 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-headline text-foreground flex items-center justify-center gap-3">
              <Truck className="w-7 h-7 sm:w-9 sm:h-9 text-primary" />
              Cargo
            </h1>
            <p className={`mt-1 text-xs text-foreground ${arefRuqaa.className}`}>
              الحساب كيطول الشركة، وكيطور الخدمة
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Calcule le prix total pour deux types de produits en fonction des données de la cargaison.
            </p>
          </div>
          <div className="flex-shrink-0">
             <AuthArea />
          </div>
        </header>


        <div className="grid md:grid-cols-5 gap-4 md:gap-6">
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-bold">Données de la Cargaison</CardTitle>
                <CardDescription>Entrez les détails ci-dessous.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:gap-5">
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    id="grossWeight"
                    label="Poids total brut"
                    value={grossWeight}
                    setValue={setGrossWeight}
                    unit="kg"
                    icon={<Truck className="w-4 h-4 text-primary" />}
                    step={10}
                    isBold
                    isError={errors.grossWeight}
                  />
                  <InputField
                    id="fullCrateWeight"
                    label="Poids caisse pleine"
                    value={fullCrateWeight}
                    setValue={setFullCrateWeight}
                    unit="kg"
                    icon={<Scale className="w-4 h-4 text-primary" />}
                    isBold
                    isError={errors.fullCrateWeight}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    id="mlihCrates"
                    label="مليح"
                    value={mlihCrates}
                    setValue={setMlihCrates}
                    unit="caisses"
                    icon={<Package className="w-4 h-4 text-primary" />}
                    isBold
                  />
                  <InputField
                    id="dichiCrates"
                    label="ديشي"
                    value={dichiCrates}
                    setValue={setDichiCrates}
                    unit="caisses"
                    icon={<Package className="w-4 h-4 text-primary" />}
                    isBold
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    id="mlihPrice"
                    label="Prix المليح"
                    value={mlihPrice}
                    setValue={setMlihPrice}
                    unit="DH"
                    icon={<CircleDollarSign className="w-4 h-4 text-primary" />}
                    step={5}
                    isBold
                  />
                  <InputField
                    id="dichiPrice"
                    label="Prix الديشي"
                    value={dichiPrice}
                    setValue={setDichiPrice}
                    unit="DH"
                    icon={<CircleDollarSign className="w-4 h-4 text-primary" />}
                    step={5}
                    isBold
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleCalculate}>
                  <Calculator className="mr-2 h-4 w-4" /> Calculer
                </Button>
              </CardFooter>
            </Card>
          </div>
          {showResults && (
            <div className="md:col-span-3">
              <Card className="shadow-lg h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Résumé du Calcul</CardTitle>
                  <CardDescription>Voici la répartition détaillée des poids et des prix.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-center">
                      <div className="bg-secondary/50 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground font-bold">صندوق حرة</p>
                          <p className="text-base sm:text-lg font-bold">{calculations.totalVirtualCrates.toFixed(2)}</p>
                      </div>
                      <div className="bg-secondary/50 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground font-bold">المليح حر</p>
                          <p className="text-base sm:text-lg font-bold">{calculations.virtualCratesMlih.toFixed(2)}</p>
                      </div>
                      <div className="bg-secondary/50 p-2 sm:p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground font-bold">الديشي حر</p>
                          <p className="text-base sm:text-lg font-bold">{calculations.virtualCratesDichi.toFixed(2)}</p>
                      </div>
                  </div>

                  <div className="overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead className="w-[150px] sm:w-[200px] font-bold">Catégorie</TableHead>
                                  <TableHead className="text-center font-bold">المليح (Mlih)</TableHead>
                                  <TableHead className="text-center font-bold">الديشي (Dichi)</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              <TableRow>
                                  <TableCell className="font-medium flex items-center gap-2 text-xs sm:text-sm"><Scale className="w-4 h-4 text-primary"/>Poids net (kg)</TableCell>
                                  <TableCell className="text-center text-xs sm:text-sm">{calculations.netWeightMlih.toFixed(2)}</TableCell>
                                  <TableCell className="text-center text-xs sm:text-sm">{calculations.netWeightDichi.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow>
                                  <TableCell className="font-bold flex items-center gap-2 text-xs sm:text-sm"><Calculator className="w-4 h-4 text-primary"/>صندوق حرة</TableCell>
                                  <TableCell className="text-center font-bold text-xs sm:text-sm">{calculations.virtualCratesMlih.toFixed(2)}</TableCell>
                                  <TableCell className="text-center font-bold text-xs sm:text-sm">{calculations.virtualCratesDichi.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow className="bg-primary/10">
                                  <TableCell className="font-semibold flex items-center gap-2 text-xs sm:text-sm"><CircleDollarSign className="w-4 h-4 text-primary"/>Prix total (DH)</TableCell>
                                  <TableCell className="text-center font-bold text-xs sm:text-sm">{formatCurrency(calculations.totalPriceMlih)}</TableCell>
                                  <TableCell className="text-center font-bold text-xs sm:text-sm">{formatCurrency(calculations.totalPriceDichi)}</TableCell>
                              </TableRow>
                          </TableBody>
                      </Table>
                  </div>
                </CardContent>
                <CardFooter className="mt-auto flex flex-col gap-3">
                  <div className="w-full bg-accent text-accent-foreground p-3 rounded-lg flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold">Prix Total Général</span>
                      <span className="text-lg sm:text-xl font-extrabold">{formatCurrency(calculations.grandTotalPrice)}</span>
                  </div>
                  <div className="w-full bg-secondary text-secondary-foreground p-3 rounded-lg flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold">Prix Total (Riyal)</span>
                      <span className="text-lg sm:text-xl font-extrabold">{formatCurrency(calculations.grandTotalPriceRiyal, 'Riyal')}</span>
                  </div>
                  <Dialog open={isSaveDialogOpen} onOpenChange={setSaveDialogOpen}>
                    <DialogTrigger asChild>
                       <Button className="w-full" onClick={handleOpenSaveDialog}>
                        <Save className="mr-2 h-4 w-4" /> Enregistrer le Calcul
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Enregistrer les détails</DialogTitle>
                        <DialogDescription>
                          Ajoutez des informations supplémentaires pour ce calcul.
                          { !user && " Connectez-vous pour synchroniser avec le serveur."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="clientName" className="text-right">Nom du client</Label>
                          <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="remainingCrates" className="text-right font-bold">الصندوق الباقي</Label>
                           <Input 
                                id="remainingCrates" 
                                type="number" 
                                value={remainingCrates}
                                onChange={(e) => setRemainingCrates(e.target.value)}
                                className="col-span-3" 
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="remainingMoney" className="text-right">Reste d'argent</Label>
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
                          <Button variant="outline">Annuler</Button>
                        </DialogClose>
                        <Button onClick={handleSave}>Enregistrer</Button>
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
                  <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Historique
                  </CardTitle>
                  <CardDescription>
                    {user ? "Vos calculs enregistrés et prêts à être synchronisés." : "Vos calculs sont sauvegardés localement. Connectez-vous pour les synchroniser."}
                  </CardDescription>
                </div>
                {history.length > 0 && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button variant="outline" size="sm" onClick={downloadHistory}>
                      <Download className="mr-1 h-3 w-3" /> Télécharger
                    </Button>
                    <Button variant="destructive" size="sm" onClick={clearHistory}>
                      <Trash2 className="mr-1 h-3 w-3" /> Vider
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[420px] pr-3">
                {history.length > 0 ? (
                    <div className="space-y-4">
                      {history.map((item) => (
                        <div key={item.id} className="p-3 bg-secondary/50 rounded-lg">
                          <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs text-muted-foreground">{item.date}</p>
                                <p className="font-bold text-sm flex items-center gap-1"><User className="w-3 h-3"/>{item.clientName}</p>
                              </div>
                              <div className="flex items-center gap-1 -mr-2 -mt-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => openEditDialog(item)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 text-destructive" onClick={() => handleDelete(item.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between items-center text-sm">
                            <p className="font-semibold">Prix Total (Riyal):</p>
                            <p className="font-bold">{formatCurrency(item.results.grandTotalPriceRiyal, 'Riyal')}</p>
                          </div>
                          <div className="flex justify-between items-center text-sm mt-1">
                                <p className="font-bold flex items-center gap-1"><Package className="w-3 h-3"/>مجموع الصندوق:</p>
                                <p className="font-bold">{item.totalCrates}</p>
                          </div>
                          <Separator className="my-2" />
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold flex items-center gap-1"><Warehouse className="w-3 h-3"/>الصندوق الباقي:</span>
                                    <span className="font-bold">{item.remainingCrates}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold flex items-center gap-1"><Wallet className="w-3 h-3"/>Reste argent:</span>
                                    <span className="font-bold">{formatCurrency(item.remainingMoney)}</span>
                                </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center pt-10">Aucun calcul enregistré.</p>
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
                    <DialogTitle>Modifier l'entrée de l'historique</DialogTitle>
                    <DialogDescription>
                        Mettez à jour les informations pour cette entrée.
                    </DialogDescription>
                </DialogHeader>
                {editingEntry && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editClientName" className="text-right">Nom du client</Label>
                            <Input 
                                id="editClientName" 
                                value={editingEntry.clientName} 
                                onChange={(e) => setEditingEntry({ ...editingEntry, clientName: e.target.value })}
                                className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editRemainingCrates" className="text-right font-bold">الصندوق الباقي</Label>
                            <Input 
                                id="editRemainingCrates" 
                                type="number" 
                                value={editingEntry.remainingCrates} 
                                onChange={(e) => setEditingEntry({ ...editingEntry, remainingCrates: Number(e.target.value) })}
                                className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="editRemainingMoney" className="text-right">Reste d'argent</Label>
                            <Input 
                                id="editRemainingMoney" 
                                type="number" 
                                value={editingEntry.remainingMoney} 
                                onChange={(e) => setEditingEntry({ ...editingEntry, remainingMoney: Number(e.target.value) })}
                                className="col-span-3" />
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingEntry(null)}>Annuler</Button>
                    <Button onClick={handleUpdate}>Sauvegarder</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}

    

    

    
