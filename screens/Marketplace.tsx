import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Building, Filter } from 'lucide-react';

const MarketplaceScreen: React.FC = () => {
    const navigate = useNavigate();

    const opportunities = [
        { id: 1, title: 'Project Alpha', dept: 'Fintech', type: 'Remote', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop', isNew: true },
        { id: 2, title: 'Project Apollo', dept: 'Cloud Infra', type: 'Hybrid', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop', isHot: true },
        { id: 3, title: 'UX Research', dept: 'Product', type: 'Remote', image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=800&auto=format&fit=crop' },
        { id: 4, title: 'AI Integration', dept: 'R&D', type: 'On-site', image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=800&auto=format&fit=crop', isHot: true },
        { id: 5, title: 'Legacy Migration', dept: 'Core Banking', type: 'Hybrid', image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=800&auto=format&fit=crop' },
        { id: 6, title: 'Security Audit', dept: 'SecOps', type: 'Remote', image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop' },
    ];

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto">
            <div className="flex flex-col gap-8 p-4 md:px-10 py-8 max-w-[1400px] mx-auto w-full">
                
                {/* Hero Section */}
                <div className="rounded-3xl bg-cover bg-center p-8 md:p-16 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] shadow-2xl" style={{backgroundImage: "linear-gradient(rgba(17, 27, 34, 0.7), rgba(17, 27, 34, 0.9)), url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop')"}}>
                    <div className="text-center relative z-10 text-white max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Find Your Next Impact</h1>
                        <p className="text-lg md:text-xl text-slate-200 mb-8">Explore internal opportunities and grow your career with new challenges.</p>
                        
                        <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl w-full max-w-lg mx-auto">
                            <Search className="text-white/60 ml-3" size={24} />
                            <input type="text" placeholder="Search for roles, skills, or projects..." className="bg-transparent border-none outline-none text-white placeholder:text-white/60 w-full px-4 h-10 text-base" />
                            <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl font-bold transition-colors">Search</button>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Explore Opportunities <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-[#16222b] dark:text-slate-400 px-2 py-1 rounded-full border border-slate-200 dark:border-[#233948]">24 Active</span>
                    </h2>
                    <button className="flex items-center gap-2 text-slate-600 dark:text-text-secondary hover:text-primary transition-colors font-medium">
                        <Filter size={18} /> Filter Results
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    {opportunities.map((opp) => (
                            <div key={opp.id} onClick={() => navigate('/project-detail')} className="group flex flex-col rounded-2xl border border-slate-200 dark:border-[#233948] bg-white dark:bg-[#16222b] overflow-hidden hover:shadow-2xl hover:border-primary/50 dark:hover:border-primary transition-all cursor-pointer transform hover:-translate-y-1 duration-300">
                            <div className="h-48 bg-cover bg-center relative" style={{backgroundImage: `url('${opp.image}')`}}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                                {opp.isNew && <div className="absolute top-4 right-4 bg-primary text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg">New</div>}
                                {opp.isHot && <div className="absolute top-4 right-4 bg-orange-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full shadow-lg">Hot</div>}
                                
                                <div className="absolute bottom-4 left-4 text-white">
                                    <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">{opp.dept}</p>
                                    <h3 className="font-bold text-xl leading-tight">{opp.title}</h3>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col gap-4">
                                <div className="flex gap-4 text-sm text-slate-500 dark:text-text-secondary">
                                    <div className="flex items-center gap-1.5">
                                        <Building size={16} />
                                        <span>{opp.dept}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={16} />
                                        <span>{opp.type}</span>
                                    </div>
                                </div>
                                <button className="w-full py-2.5 mt-2 bg-slate-100 dark:bg-[#111b22] text-slate-700 dark:text-white font-bold rounded-xl text-sm group-hover:bg-primary group-hover:text-white transition-colors">
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MarketplaceScreen;
