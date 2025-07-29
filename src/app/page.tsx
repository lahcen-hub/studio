"use client";

import { useState, useMemo, type ChangeEvent, type FC, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Boxes, Calculator, Scale, CircleDollarSign, Package, Truck, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InputFieldProps {
  id: string;
  label: string;
  value: number;
  setValue: (value: number) => void;
  unit: string;
  icon: ReactNode;
  step?: number;
}

const InputField: FC<InputFieldProps> = ({ id, label, value, setValue, unit, icon, step = 1 }) => {
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
      <Label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
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


export default function CargoValuatorPage() {
  const [mlihCrates, setMlihCrates] = useState(72);
  const [dichiCrates, setDichiCrates] = useState(48);
  const [grossWeight, setGrossWeight] = useState(3280);
  const [emptyCrateWeight, setEmptyCrateWeight] = useState(3);
  const [fullCrateWeight, setFullCrateWeight] = useState(27);
  const [mlihPrice, setMlihPrice] = useState(85);
  const [dichiPrice, setDichiPrice] = useState(70);

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
    
    return {
      totalCrates,
      totalEmptyCratesWeight,
      totalNetProductWeight,
      averageNetWeightPerCrate,
      netWeightMlih,
      netWeightDichi,
      virtualCratesMlih,
      virtualCratesDichi,
      totalPriceMlih,
      totalPriceDichi,
      grandTotalPrice
    };
  }, [mlihCrates, dichiCrates, grossWeight, emptyCrateWeight, fullCrateWeight, mlihPrice, dichiPrice]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(value);
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-headline text-foreground">
            CargoValuator
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Calculez le prix de votre cargaison de manière simple et rapide.
          </p>
        </header>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Données de la Cargaison</CardTitle>
                <CardDescription>Entrez les détails ci-dessous.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <InputField
                  id="mlihCrates"
                  label="Caisses المليح"
                  value={mlihCrates}
                  setValue={setMlihCrates}
                  unit="caisses"
                  icon={<Package className="w-4 h-4 text-primary" />}
                />
                <InputField
                  id="dichiCrates"
                  label="Caisses الديشي"
                  value={dichiCrates}
                  setValue={setDichiCrates}
                  unit="caisses"
                  icon={<Package className="w-4 h-4 text-primary" />}
                />
                <InputField
                  id="grossWeight"
                  label="Poids total brut"
                  value={grossWeight}
                  setValue={setGrossWeight}
                  unit="kg"
                  icon={<Truck className="w-4 h-4 text-primary" />}
                  step={10}
                />
                <InputField
                  id="emptyCrateWeight"
                  label="Poids carton vide"
                  value={emptyCrateWeight}
                  setValue={setEmptyCrateWeight}
                  unit="kg"
                  icon={<Boxes className="w-4 h-4 text-primary" />}
                />
                 <InputField
                  id="fullCrateWeight"
                  label="Poids caisse pleine"
                  value={fullCrateWeight}
                  setValue={setFullCrateWeight}
                  unit="kg"
                  icon={<Scale className="w-4 h-4 text-primary" />}
                />
                <InputField
                  id="mlihPrice"
                  label="Prix caisse المليح"
                  value={mlihPrice}
                  setValue={setMlihPrice}
                  unit="DH"
                  icon={<CircleDollarSign className="w-4 h-4 text-primary" />}
                  step={5}
                />
                 <InputField
                  id="dichiPrice"
                  label="Prix caisse الديشي"
                  value={dichiPrice}
                  setValue={setDichiPrice}
                  unit="DH"
                  icon={<CircleDollarSign className="w-4 h-4 text-primary" />}
                  step={5}
                />
              </CardContent>
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
                        <p className="text-sm text-muted-foreground">Poids Caisses Vides</p>
                        <p className="text-xl font-bold">{calculations.totalEmptyCratesWeight.toFixed(2)} kg</p>
                    </div>
                     <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Poids Net Total</p>
                        <p className="text-xl font-bold">{calculations.totalNetProductWeight.toFixed(2)} kg</p>
                    </div>
                     <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Poids Net / Caisse</p>
                        <p className="text-xl font-bold">{calculations.averageNetWeightPerCrate.toFixed(2)} kg</p>
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
                                <TableCell className="font-medium flex items-center gap-2"><Calculator className="w-4 h-4 text-primary"/>Caisses virtuelles</TableCell>
                                <TableCell className="text-center">{calculations.virtualCratesMlih.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{calculations.virtualCratesDichi.toFixed(2)}</TableCell>
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
              <CardFooter className="mt-auto">
                <div className="w-full bg-accent text-accent-foreground p-4 rounded-lg flex justify-between items-center">
                    <span className="text-xl font-bold">Prix Total Général</span>
                    <span className="text-2xl font-extrabold">{formatCurrency(calculations.grandTotalPrice)}</span>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
