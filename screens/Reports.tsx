import React, { useState, useEffect, useRef } from 'react';
import { Download, Bot, Send, User, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { sendCopilotMessage } from '../services/geminiService';
import { ChatMessage } from '../types';

const data = [
    { name: 'Jan', utilization: 65, hiring: 4 },
    { name: 'Feb', utilization: 75, hiring: 7 },
    { name: 'Mar', utilization: 87, hiring: 12 },
    { name: 'Apr', utilization: 82, hiring: 10 },
];

const pieData = [
    { name: 'Frontend', value: 40 },
    { name: 'Backend', value: 30 },
    { name: 'DevOps', value: 20 },
    { name: 'Design', value: 10 },
];

const COLORS = ['#1392ec', '#0f7bc2', '#325167', '#92b2c9'];

const ReportsScreen: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'model', text: 'Hello! I\'ve analyzed your Q3 data. Team Alpha has a 15% risk of delay due to backend resource shortages. How can I assist you?', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        const responseText = await sendCopilotMessage(input);
        
        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);
    };

    return (
        <div className="flex h-full w-full overflow-hidden relative">
            
            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-8 scroll-smooth no-scrollbar">
                <div className="max-w-[1400px] mx-auto w-full">
                    <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
                        <div>
                            <h2 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">Reports Dashboard</h2>
                            <p className="text-slate-500 dark:text-text-secondary mt-1">Real-time metrics and AI insights.</p>
                        </div>
                        <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] text-slate-700 dark:text-white text-sm font-bold hover:bg-slate-50 dark:hover:bg-[#111b22] transition-colors shadow-sm">
                            <Download size={18} />
                            <span>Export PDF</span>
                        </button>
                    </header>
                    
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="rounded-2xl p-6 bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-slate-500 dark:text-text-secondary text-sm font-bold uppercase tracking-wide">Utilization Rate</p>
                                <Activity size={20} className="text-emerald-500" />
                            </div>
                            <p className="text-slate-900 dark:text-white text-3xl font-black">87%</p>
                            <span className="text-emerald-500 text-xs font-bold">+5% vs last month</span>
                        </div>
                        <div className="rounded-2xl p-6 bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-slate-500 dark:text-text-secondary text-sm font-bold uppercase tracking-wide">Open Roles</p>
                                <User size={20} className="text-blue-500" />
                            </div>
                            <p className="text-slate-900 dark:text-white text-3xl font-black">12</p>
                            <span className="text-blue-500 text-xs font-bold">Urgent: Senior Backend</span>
                        </div>
                        <div className="rounded-2xl p-6 bg-white dark:bg-[#16222b] border border-slate-200 dark:border-[#233948] shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-slate-500 dark:text-text-secondary text-sm font-bold uppercase tracking-wide">Risk of Delay</p>
                                <Activity size={20} className="text-rose-500" />
                            </div>
                            <p className="text-slate-900 dark:text-white text-3xl font-black">15%</p>
                            <span className="text-rose-500 text-xs font-bold">2 projects impacted</span>
                        </div>
                        <div className="rounded-2xl p-6 bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg">
                            <p className="text-white/80 text-sm font-bold uppercase tracking-wide">Budget Used</p>
                            <p className="text-white text-3xl font-black mt-4">$245k</p>
                            <span className="text-white/80 text-xs font-bold">65% of Q3 Budget</span>
                        </div>
                    </div>

                    {/* Charts Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <div className="rounded-2xl border border-slate-200 dark:border-[#233948] bg-white dark:bg-[#16222b] p-6 shadow-sm">
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-6">Resource Trend</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#233948" vertical={false} />
                                        <XAxis dataKey="name" stroke="#92b2c9" tick={{fill: '#92b2c9'}} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#92b2c9" tick={{fill: '#92b2c9'}} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#16222b', borderColor: '#233948', color: '#fff' }}
                                            itemStyle={{ color: '#fff' }}
                                            cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                        />
                                        <Bar dataKey="utilization" fill="#1392ec" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 dark:border-[#233948] bg-white dark:bg-[#16222b] p-6 shadow-sm">
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-6">Skill Distribution</h3>
                            <div className="h-[300px] w-full flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#16222b', borderColor: '#233948', color: '#fff' }} />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Skill Gaps List */}
                    <div className="rounded-2xl border border-slate-200 dark:border-[#233948] bg-white dark:bg-[#16222b] p-6 shadow-sm">
                        <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-6">Critical Skill Gaps</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white mb-2">
                                    <span>React Native</span>
                                    <span className="text-orange-500">20% coverage</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-background-dark rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 w-[20%] rounded-full shadow-lg shadow-orange-500/30"></div>
                                </div>
                            </div>
                                <div>
                                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white mb-2">
                                    <span>Python (AI/ML)</span>
                                    <span className="text-primary">65% coverage</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-background-dark rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[65%] rounded-full shadow-lg shadow-primary/30"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            
            {/* AI Copilot Sidebar */}
            <aside className="hidden xl:flex flex-col w-[400px] border-l border-slate-200 dark:border-[#233948] bg-white dark:bg-[#111b22] shrink-0 h-full shadow-2xl z-20">
                <div className="p-5 border-b border-slate-200 dark:border-[#233948] flex items-center gap-3 bg-slate-50 dark:bg-[#16202a]">
                    <div className="size-9 rounded-xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h3 className="text-slate-900 dark:text-white text-sm font-bold">DevManager Copilot</h3>
                        <p className="text-xs text-green-500 flex items-center gap-1 font-medium">
                            <span className="block w-2 h-2 rounded-full bg-green-500"></span>
                            Online
                        </p>
                    </div>
                </div>
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 bg-slate-50/50 dark:bg-[#111b22]">
                        {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-md ${
                                msg.role === 'user' 
                                    ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-white' 
                                    : 'bg-gradient-to-tr from-primary to-purple-500 text-white'
                            }`}>
                                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                            </div>
                            <div className={`max-w-[80%] rounded-2xl p-4 text-sm shadow-sm ${
                                msg.role === 'user'
                                    ? 'bg-white dark:bg-[#233948] rounded-tr-none text-slate-800 dark:text-white'
                                    : 'bg-white dark:bg-[#16222b] rounded-tl-none text-slate-600 dark:text-gray-200 border border-slate-100 dark:border-[#233948]'
                            }`}>
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                            <div className="flex gap-3">
                            <div className="size-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shrink-0 mt-1">
                                <Bot size={14} className="text-white" />
                            </div>
                            <div className="bg-white dark:bg-[#16222b] rounded-2xl rounded-tl-none p-4 text-sm border border-slate-100 dark:border-[#233948] flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-5 border-t border-slate-200 dark:border-[#233948] bg-white dark:bg-[#16202a]">
                    <form onSubmit={handleSendMessage} className="relative">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-[#111b22] border border-slate-200 dark:border-[#233948] text-slate-900 dark:text-white text-sm rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-400" 
                            placeholder="Ask Copilot about trends..." 
                            type="text"
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </aside>
        </div>
    );
};

export default ReportsScreen;
