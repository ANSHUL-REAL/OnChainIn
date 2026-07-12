import { useState } from 'react';
import { useParams } from 'react-router';
import { DashboardLayout } from '@/components/DashboardLayout';
import store from '@/data/store';
import { Plus, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#E49B3A', '#E63946', '#4A80C8', '#10B981', '#8B5CF6', '#EC4899'];

export default function EventBudget() {
  const { id } = useParams<{ id: string }>();
  const event = store.getEventById(id || '');
  if (!event) return <DashboardLayout title="Budget"><p className="text-white/40">Event not found</p></DashboardLayout>;

  const items = store.getEventBudgetItems(event.id);
  const income = items.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0);
  const expense = items.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);
  const balance = income - expense;

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const expenseByCategory = items.filter(i => i.type === 'expense').reduce((acc: Record<string, number>, i) => {
    acc[i.category || 'Other'] = (acc[i.category || 'Other'] || 0) + i.amount;
    return acc;
  }, {});
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
  const barData = [{ name: 'Income', amount: income }, { name: 'Expenses', amount: expense }];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    store.createBudgetItem({ event_id: event.id, type, title, amount: parseFloat(amount) || 0, category });
    setShowForm(false); setTitle(''); setAmount(''); setCategory('');
  };

  const handleDelete = (itemId: string) => { store.deleteBudgetItem(itemId); };

  return (
    <DashboardLayout title="Budget Analytics">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-lg p-4">
          <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-lg font-bold text-emerald-400">Rs.{income.toLocaleString()}</p>
          <p className="text-[10px] text-white/30">Total Income</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <TrendingDown className="w-5 h-5 text-rose-400 mb-2" />
          <p className="text-lg font-bold text-rose-400">Rs.{expense.toLocaleString()}</p>
          <p className="text-[10px] text-white/30">Total Expenses</p>
        </div>
        <div className="glass-card rounded-lg p-4">
          <Wallet className="w-5 h-5 text-[#E49B3A] mb-2" />
          <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Rs.{balance.toLocaleString()}</p>
          <p className="text-[10px] text-white/30">Balance</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-medium text-white mb-3">Expense Breakdown</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} /></PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-white/30 text-center py-8">No expense data</p>}
        </div>
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-xs font-medium text-white mb-3">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}><XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} /><YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 10 }} /><Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="amount" fill="#E49B3A" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Transactions ({items.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="text-[10px] px-2 py-1 rounded bg-[#E49B3A]/20 text-[#E49B3A] flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="glass-card rounded-lg p-3 mb-3 space-y-2">
          <div className="flex gap-2">
            <select value={type} onChange={e => setType(e.target.value as any)} className="bg-white/5 border border-white/10 rounded py-1.5 px-2 text-xs text-white focus:outline-none focus:border-[#E49B3A]/50">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Title" className="flex-1 bg-white/5 border border-white/10 rounded py-1.5 px-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50" />
          </div>
          <div className="flex gap-2">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Amount" className="w-24 bg-white/5 border border-white/10 rounded py-1.5 px-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50" />
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category" className="flex-1 bg-white/5 border border-white/10 rounded py-1.5 px-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#E49B3A]/50" />
          </div>
          <button type="submit" className="gold-btn text-[10px] py-1.5 px-3">Add</button>
        </form>
      )}

      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-white/30 text-center py-4">No transactions yet</p>}
        {items.map((item) => (
          <div key={item.id} className="glass-card rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${item.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <div>
                <p className="text-sm text-white">{item.title}</p>
                <p className="text-[10px] text-white/30">{item.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className={`text-sm font-medium ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{item.type === 'income' ? '+' : '-'}Rs.{item.amount.toLocaleString()}</p>
              <button onClick={() => handleDelete(item.id)} className="text-[10px] text-white/20 hover:text-red-400 transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
