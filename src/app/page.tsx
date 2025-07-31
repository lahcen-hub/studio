
"use client";

import { useState, useMemo, type ChangeEvent, type FC, type ReactNode, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Boxes, Calculator, Scale, CircleDollarSign, Package, Truck, Minus, Plus, Save, History, Trash2, User, Wallet, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';

interface InputFieldProps {
  id: string;
  label: string;
  value: number;
  setValue: (value: number) => void;
  unit: string;
  icon: ReactNode;
  step?: number;
  isBold?: boolean;
}

const InputField: FC<InputFieldProps> = ({ id, label, value, setValue, unit, icon, step = 1, isBold = false }) => {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
        setValue(0);
    } else {
        setValue(parseFloat(val));
    }
  };
  
  const increment = () => setValue(value + step);
  const decrement = () => setValue(Math.max(0, value - step));


  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={`flex items-center gap-2 text-sm ${isBold ? 'font-bold' : ''}`}>
        {icon}
        {label}
      </Label>
      <div className="relative flex items-center">
        <Input
          id={id}
          type="number"
          value={value === 0 ? '' : value}
          onChange={handleInputChange}
          placeholder="0"
          className="pr-16"
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
}


export default function CargoValuatorPage() {
  const [mlihCrates, setMlihCrates] = useState(72);
  const [dichiCrates, setDichiCrates] = useState(48);
  const [grossWeight, setGrossWeight] = useState(3280);
  const emptyCrateWeight = 3;
  const [fullCrateWeight, setFullCrateWeight] = useState(27);
  const [mlihPrice, setMlihPrice] = useState(85);
  const [dichiPrice, setDichiPrice] = useState(70);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const [clientName, setClientName] = useState('');
  const [remainingCrates, setRemainingCrates] = useState(0);
  const [remainingMoney, setRemainingMoney] = useState(0);
  const [isDialogOpen, setDialogOpen] = useState(false);
  
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

  const calculations = useMemo(() => {
    const totalCrates = mlihCrates + dichiCrates;
    const totalEmptyCratesWeight = totalCrates * emptyCrateWeight;
    const totalNetProductWeight = grossWeight > totalEmptyCratesWeight ? grossWeight - totalEmptyCratesWeight : 0;
    const averageNetWeightPerCrate = totalCrates > 0 ? totalNetProductWeight / totalCrates : 0;
    
    const netWeightMlih = mlihCrates * averageNetWeightPerCrate;
    const netWeightDichi = dichiCrates * averageNetWeightPerCrate;

    const virtualCratesMlih = fullCrateWeight > 0 ? netWeightMlih / fullCrateWeight : 0;
    const virtualCratesDichi = fullCrateWeight > 0 ? netWeightDichi / fullCrateWeight : 0;

    const totalPriceMlih = virtualCratesMlih * mlihPrice;
    const totalPriceDichi = virtualCratesDichi * dichiPrice;

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
  }, [mlihCrates, dichiCrates, grossWeight, emptyCrateWeight, fullCrateWeight, mlihPrice, dichiPrice]);

  const formatCurrency = (value: number, currency = 'MAD') => {
    const options: Intl.NumberFormatOptions = { style: 'currency', currency, currencyDisplay: 'code' };
    let locale = 'fr-MA';
    
    if (currency === 'Riyal') {
        const numberPart = new Intl.NumberFormat('fr-MA').format(value);
        return `${numberPart} Riyal`;
    }

    return new Intl.NumberFormat(locale, options).format(value);
  }
  
  const handleSave = () => {
    const newEntry: HistoryEntry = {
      id: Date.now(),
      date: new Date().toLocaleString('fr-FR'),
      results: {
        grandTotalPrice: calculations.grandTotalPrice,
        grandTotalPriceRiyal: calculations.grandTotalPriceRiyal,
      },
      clientName: clientName,
      remainingCrates: remainingCrates,
      remainingMoney: remainingMoney
    };
    setHistory([newEntry, ...history]);
    // Reset form and close dialog
    setClientName('');
    setRemainingCrates(0);
    setRemainingMoney(0);
    setDialogOpen(false);
  };
  
  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline text-foreground flex items-center justify-center gap-3">
            <Calculator className="w-12 h-12 text-primary" />
            Cargo
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Calculez le prix de votre cargaison de manière simple et rapide.
          </p>
        </header>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Données de la Cargaison</CardTitle>
                <CardDescription>Entrez les détails ci-dessous.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
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
                  />
                  <InputField
                    id="fullCrateWeight"
                    label="Poids caisse pleine"
                    value={fullCrateWeight}
                    setValue={setFullCrateWeight}
                    unit="kg"
                    icon={<Scale className="w-4 h-4 text-primary" />}
                    isBold
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
                 <Button className="w-full">
                  <Calculator className="mr-2 h-4 w-4" /> Calculer
                 </Button>
              </CardFooter>
            </Card>
          </div>
          <div className="md:col-span-3">
             <Card className="shadow-lg h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-2xl">Résumé du Calcul</CardTitle>
                <CardDescription>Voici la répartition détaillée des poids et des prix.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
                    <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground font-bold">صندوق حرة</p>
                        <p className="text-xl font-bold">{calculations.totalVirtualCrates.toFixed(2)}</p>
                    </div>
                     <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground font-bold">المليح حر</p>
                        <p className="text-xl font-bold">{calculations.virtualCratesMlih.toFixed(2)}</p>
                    </div>
                     <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground font-bold">الديشي حر</p>
                        <p className="text-xl font-bold">{calculations.virtualCratesDichi.toFixed(2)}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px] font-bold">Catégorie</TableHead>
                                <TableHead className="text-center font-bold">المليح (Mlih)</TableHead>
                                <TableHead className="text-center font-bold">الديشي (Dichi)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium flex items-center gap-2"><Scale className="w-4 h-4 text-primary"/>Poids net (kg)</TableCell>
                                <TableCell className="text-center">{calculations.netWeightMlih.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{calculations.netWeightDichi.toFixed(2)}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell className="font-bold flex items-center gap-2"><Calculator className="w-4 h-4 text-primary"/>صندوق حرة</TableCell>
                                <TableCell className="text-center font-bold">{calculations.virtualCratesMlih.toFixed(2)}</TableCell>
                                <TableCell className="text-center font-bold">{calculations.virtualCratesDichi.toFixed(2)}</TableCell>
                            </TableRow>
                             <TableRow className="bg-primary/10">
                                <TableCell className="font-semibold flex items-center gap-2"><CircleDollarSign className="w-4 h-4 text-primary"/>Prix total (DH)</TableCell>
                                <TableCell className="text-center font-bold">{formatCurrency(calculations.totalPriceMlih)}</TableCell>
                                <TableCell className="text-center font-bold">{formatCurrency(calculations.totalPriceDichi)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
              </CardContent>
              <CardFooter className="mt-auto flex flex-col gap-4">
                <div className="w-full bg-accent text-accent-foreground p-4 rounded-lg flex justify-between items-center">
                    <span className="text-xl font-bold">Prix Total Général</span>
                    <span className="text-2xl font-extrabold">{formatCurrency(calculations.grandTotalPrice)}</span>
                </div>
                <div className="w-full bg-secondary text-secondary-foreground p-4 rounded-lg flex justify-between items-center">
                    <span className="text-xl font-bold">Prix Total (Riyal)</span>
                    <span className="text-2xl font-extrabold">{formatCurrency(calculations.grandTotalPriceRiyal, 'Riyal')}</span>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Save className="mr-2 h-4 w-4" /> Enregistrer le Calcul
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enregistrer les détails</DialogTitle>
                      <DialogDescription>
                        Ajoutez des informations supplémentaires pour ce calcul.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="clientName" className="text-right">Nom du client</Label>
                        <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="remainingCrates" className="text-right">Reste des caisses</Label>
                        <Input id="remainingCrates" type="number" value={remainingCrates} onChange={(e) => setRemainingCrates(Number(e.target.value))} className="col-span-3" />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="remainingMoney" className="text-right">Reste d'argent</Label>
                        <Input id="remainingMoney" type="number" value={remainingMoney} onChange={(e) => setRemainingMoney(Number(e.target.value))} className="col-span-3" />
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
        </div>

        <div className="mt-8">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <History className="w-6 h-6" />
                    Historique
                  </CardTitle>
                  <CardDescription>
                    Vos calculs enregistrés.
                  </CardDescription>
                </div>
                 {history.length > 0 && (
                   <Button variant="destructive" size="sm" onClick={clearHistory}>
                     <Trash2 className="mr-2 h-4 w-4" /> Vider
                   </Button>
                 )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[420px]">
                 {history.length > 0 ? (
                    <div className="space-y-4">
                      {history.map((item) => (
                        <div key={item.id} className="p-3 bg-secondary/50 rounded-lg">
                           <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground">{item.date}</p>
                              <p className="font-bold text-sm flex items-center gap-1"><User className="w-3 h-3"/>{item.clientName}</p>
                           </div>
                           <Separator className="my-2" />
                           <div className="flex justify-between items-center">
                              <p className="font-semibold">Prix Total:</p>
                              <p className="font-bold">{formatCurrency(item.results.grandTotalPrice)}</p>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                             <p className="font-semibold">Prix Total (Riyal):</p>
                             <p className="font-bold">{formatCurrency(item.results.grandTotalPriceRiyal, 'Riyal')}</p>
                           </div>
                           <Separator className="my-2" />
                           <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold flex items-center gap-1"><Warehouse className="w-3 h-3"/>Reste caisses:</span>
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
    </main>
  );
}
