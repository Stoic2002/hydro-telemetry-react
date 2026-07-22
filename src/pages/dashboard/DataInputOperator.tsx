import { useActivePLTA } from '../../features/plta/api/queries';
import { plantMatchesIdentity } from '../../features/plta/presentation';
import { Save, Info } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useNotificationStore } from '../../store/notification-store';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Select from '../../components/atoms/Select';
import Input from '../../components/atoms/Input';
import { getWIBFormDateTime } from '../../shared/lib/date';
import PlantSwitcher from '../../features/plta/components/PlantSwitcher';

const operatorFormSchema = z.object({
  inputType: z.enum(['ddc', 'spillway']),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  jam: z.string().min(1, 'Jam wajib diisi'),
  shift: z.enum(['Pagi', 'Sore', 'Malam']),
  debit: z.string(),
  elevasi: z.string(),
  suhuAir: z.string(),
  sedimen: z.string(),
  bukaanPintu1: z.string(),
  bukaanPintu2: z.string(),
  bukaanPintu3: z.string(),
  bukaanPintu4: z.string(),
}).superRefine((data, context) => {
  const validateNumber = (
    field: keyof typeof data,
    label: string,
    options: { required?: boolean; min?: number; max?: number } = {},
  ) => {
    const value = data[field];

    if (typeof value !== 'string' || value.trim() === '') {
      if (options.required) {
        context.addIssue({ code: 'custom', path: [field], message: `${label} wajib diisi` });
      }
      return;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      context.addIssue({ code: 'custom', path: [field], message: `${label} harus berupa angka` });
      return;
    }
    if (options.min !== undefined && numericValue < options.min) {
      context.addIssue({ code: 'custom', path: [field], message: `${label} minimal ${options.min}` });
    }
    if (options.max !== undefined && numericValue > options.max) {
      context.addIssue({ code: 'custom', path: [field], message: `${label} maksimal ${options.max}` });
    }
  };

  if (data.inputType === 'ddc') {
    validateNumber('elevasi', 'Elevasi', { required: true, min: 0 });
    validateNumber('debit', 'Debit', { required: true, min: 0 });
    validateNumber('suhuAir', 'Suhu air', { min: 0 });
    validateNumber('sedimen', 'Sedimen', { min: 0 });
    return;
  }

  (['bukaanPintu1', 'bukaanPintu2', 'bukaanPintu3', 'bukaanPintu4'] as const)
    .forEach((field, index) => validateNumber(field, `Bukaan pintu ${index + 1}`, {
      required: true,
      min: 0,
      max: 10,
    }));
});

type OperatorFormValues = z.infer<typeof operatorFormSchema>;

function createDefaultValues(): OperatorFormValues {
  const currentWIB = getWIBFormDateTime();

  return {
    inputType: 'ddc',
    tanggal: currentWIB.date,
    jam: currentWIB.time,
    shift: 'Pagi',
    debit: '',
    elevasi: '',
    suhuAir: '',
    sedimen: '',
    bukaanPintu1: '0',
    bukaanPintu2: '0',
    bukaanPintu3: '0',
    bukaanPintu4: '0',
  };
}

export default function DataInputOperator() {
  const { addToast } = useNotificationStore();
  const { plant, plta } = useActivePLTA();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<OperatorFormValues>({
    resolver: zodResolver(operatorFormSchema),
    defaultValues: createDefaultValues(),
  });
  const activeTab = useWatch({ control, name: 'inputType' });
  const gateOpenings = useWatch({
    control,
    name: ['bukaanPintu1', 'bukaanPintu2', 'bukaanPintu3', 'bukaanPintu4'],
  });

  const isPBS = plantMatchesIdentity(plant, 'soedirman')
    || plantMatchesIdentity(plant, 'mrica');

  const submitOperatorData = (values: OperatorFormValues) => {
    addToast({
      type: 'success',
      message: `Data ${values.inputType.toUpperCase()} lolos validasi dan disimpan sementara`,
    });
  };

  // Calculate estimated spillway outflow (mock calculation)
  const calculateOutflow = () => {
    const sum = gateOpenings.reduce((total, opening) => total + Number(opening), 0);
    return (sum * 45.5).toFixed(1); // 45.5 m3/s per meter bukaan as a mock multiplier
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">Input Data Operator — {plta.name}</h1>
          <p className="page-description">Formulir input data manual untuk DDC dan manuver Spillway.</p>
        </div>
        <PlantSwitcher page="data-input-operator" />
      </div>

      <Card noPadding className="overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            type="button"
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'ddc' ? 'text-pln-teal border-b-2 border-pln-teal bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
            }`}
            onClick={() => setValue('inputType', 'ddc', { shouldValidate: true })}
          >
            Formulir DDC (Capture)
          </button>
          <button
            type="button"
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'spillway' ? 'text-pln-teal border-b-2 border-pln-teal bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
            }`}
            onClick={() => setValue('inputType', 'spillway', { shouldValidate: true })}
          >
            Formulir Manuver Spillway
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit(submitOperatorData)} className="max-w-4xl mx-auto flex flex-col gap-8">
            
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input 
                label="Tanggal" 
                type="date" 
                {...register('tanggal')}
                error={errors.tanggal?.message}
              />
              <Input 
                label="Jam (WIB)" 
                type="time" 
                {...register('jam')}
                error={errors.jam?.message}
              />
              <Select 
                label="Shift Kerja"
                {...register('shift')}
                error={errors.shift?.message}
                options={[
                  { value: 'Pagi', label: 'Pagi (08:00 - 16:00)' },
                  { value: 'Sore', label: 'Sore (16:00 - 00:00)' },
                  { value: 'Malam', label: 'Malam (00:00 - 08:00)' },
                ]}
              />
            </div>

            <div className="h-px bg-slate-100"></div>

            {/* DDC Specific Fields */}
            {activeTab === 'ddc' && (
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input 
                    label="Elevasi Muka Air Waduk (mdpl)" 
                    type="number" 
                    step="0.01" 
                    {...register('elevasi')}
                    error={errors.elevasi?.message}
                    placeholder="Contoh: 223.10" 
                  />
                  <Input 
                    label="Total Inflow Aktual (m³/s)" 
                    type="number" 
                    step="0.1" 
                    {...register('debit')}
                    error={errors.debit?.message}
                    placeholder="Contoh: 154.2" 
                  />
                </div>

                {isPBS && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col gap-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Info size={16} className="text-pln-teal" />
                      Parameter Tambahan (PBS Soedirman)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Input 
                        label="Suhu Air Reservoir (°C)" 
                        type="number" 
                        step="0.1" 
                        {...register('suhuAir')}
                        error={errors.suhuAir?.message}
                        placeholder="Contoh: 26.5" 
                      />
                      <Input 
                        label="Sedimen Tersuspensi (ppm)" 
                        type="number" 
                        {...register('sedimen')}
                        error={errors.sedimen?.message}
                        placeholder="Contoh: 120" 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Spillway Specific Fields */}
            {activeTab === 'spillway' && (
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <Input label="Pintu 1 (m)" type="number" step="0.1" min="0" max="10" {...register('bukaanPintu1')} error={errors.bukaanPintu1?.message} />
                  <Input label="Pintu 2 (m)" type="number" step="0.1" min="0" max="10" {...register('bukaanPintu2')} error={errors.bukaanPintu2?.message} />
                  <Input label="Pintu 3 (m)" type="number" step="0.1" min="0" max="10" {...register('bukaanPintu3')} error={errors.bukaanPintu3?.message} />
                  <Input label="Pintu 4 (m)" type="number" step="0.1" min="0" max="10" {...register('bukaanPintu4')} error={errors.bukaanPintu4?.message} />
                </div>

                <div className="flex items-center justify-between p-6 bg-amber-50/50 border border-amber-100 rounded-2xl shadow-inner">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Estimasi Outflow Spillway:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-mono font-bold text-amber-600">{calculateOutflow()}</span>
                    <span className="text-sm font-bold text-amber-500 uppercase">m³/s</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
              <Button variant="ghost" type="button" className="px-8" onClick={() => reset(createDefaultValues())}>Batal</Button>
              <Button variant="primary" type="submit" leftIcon={<Save size={18} />} className="px-10">
                Simpan Data
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
