import { useState } from 'react';
import { usePLTAStore } from '../../store/plta-store';
import { pltaData } from '../../data/plta-data';
import { Edit3, Save, Info } from 'lucide-react';
import { useNotificationStore } from '../../store/notification-store';
import Button from '../../components/atoms/Button';
import Card from '../../components/atoms/Card';
import Select from '../../components/atoms/Select';
import Input from '../../components/atoms/Input';

export default function DataInputOperator() {
  const { selectedPLTAId } = usePLTAStore();
  const { addToast } = useNotificationStore();
  const plta = pltaData.find((p) => p.id === selectedPLTAId);

  const [activeTab, setActiveTab] = useState('ddc'); // 'ddc' | 'spillway'
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jam: new Date().toTimeString().split(' ')[0].substring(0, 5),
    shift: 'Pagi',
    debit: '',
    elevasi: '',
    // Extended PBS Soedirman fields
    suhuAir: '',
    sedimen: '',
    // Spillway fields
    bukaanPintu1: '0',
    bukaanPintu2: '0',
    bukaanPintu3: '0',
    bukaanPintu4: '0',
  });

  if (!plta) return <div>PLTA tidak ditemukan</div>;

  const isPBS = selectedPLTAId === 'pbs-soedirman';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({ type: 'success', message: `Data ${activeTab.toUpperCase()} berhasil disimpan ke server` });
  };

  // Calculate estimated spillway outflow (mock calculation)
  const calculateOutflow = () => {
    const sum = Number(formData.bukaanPintu1) + Number(formData.bukaanPintu2) + Number(formData.bukaanPintu3) + Number(formData.bukaanPintu4);
    return (sum * 45.5).toFixed(1); // 45.5 m3/s per meter bukaan as a mock multiplier
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Edit3 className="text-pln-teal" />
          Input Data Operator — {plta.name}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Formulir input data manual untuk DDC dan manuver Spillway.</p>
      </div>

      <Card noPadding className="overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'ddc' ? 'text-pln-teal border-b-2 border-pln-teal bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
            }`}
            onClick={() => setActiveTab('ddc')}
          >
            Formulir DDC (Capture)
          </button>
          <button
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === 'spillway' ? 'text-pln-teal border-b-2 border-pln-teal bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
            }`}
            onClick={() => setActiveTab('spillway')}
          >
            Formulir Manuver Spillway
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col gap-8">
            
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input 
                label="Tanggal" 
                type="date" 
                name="tanggal" 
                value={formData.tanggal} 
                onChange={handleChange} 
                required 
              />
              <Input 
                label="Jam (WIB)" 
                type="time" 
                name="jam" 
                value={formData.jam} 
                onChange={handleChange} 
                required 
              />
              <Select 
                label="Shift Kerja"
                name="shift" 
                value={formData.shift} 
                onChange={handleChange} 
                required
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
                    name="elevasi" 
                    value={formData.elevasi} 
                    onChange={handleChange} 
                    placeholder="Contoh: 223.10" 
                    required 
                  />
                  <Input 
                    label="Total Inflow Aktual (m³/s)" 
                    type="number" 
                    step="0.1" 
                    name="debit" 
                    value={formData.debit} 
                    onChange={handleChange} 
                    placeholder="Contoh: 154.2" 
                    required 
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
                        name="suhuAir" 
                        value={formData.suhuAir} 
                        onChange={handleChange} 
                        placeholder="Contoh: 26.5" 
                      />
                      <Input 
                        label="Sedimen Tersuspensi (ppm)" 
                        type="number" 
                        name="sedimen" 
                        value={formData.sedimen} 
                        onChange={handleChange} 
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
                  <Input label="Pintu 1 (m)" type="number" step="0.1" min="0" max="10" name="bukaanPintu1" value={formData.bukaanPintu1} onChange={handleChange} required />
                  <Input label="Pintu 2 (m)" type="number" step="0.1" min="0" max="10" name="bukaanPintu2" value={formData.bukaanPintu2} onChange={handleChange} required />
                  <Input label="Pintu 3 (m)" type="number" step="0.1" min="0" max="10" name="bukaanPintu3" value={formData.bukaanPintu3} onChange={handleChange} required />
                  <Input label="Pintu 4 (m)" type="number" step="0.1" min="0" max="10" name="bukaanPintu4" value={formData.bukaanPintu4} onChange={handleChange} required />
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
              <Button variant="ghost" type="button" className="px-8">Batal</Button>
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
