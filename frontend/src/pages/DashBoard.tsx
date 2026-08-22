import React, { useState } from 'react';
import {
    Activity,
    Radio,
    Calendar,
    Terminal,
    Cpu,
    FlaskConical,
    BarChart3,
    CheckCircle2,
    RadioTower,
    ArrowUpRight,
    Lock
} from 'lucide-react';

import { Simulations } from './Simulations';
import { EmittersReceiver } from './EmittersReceiver';
import { Scheduler } from './Scheduler';
import { WSHarness } from './WSHarness';
import { ModelsTraining } from './ModelsTraining';
import { Experiments } from './Experiments';
import { Metrics } from './Metrics';
import { RegressionPass } from './RegressionPass';

import Radar from '../components/Radar';

const SECTIONS = [
    {
        id: 'simulations',
        title: 'Simulations',
        subtitle: 'L2 & L3',
        icon: Activity,
        component: <Simulations />,
    },
    {
        id: 'emitters',
        title: 'Emitters & Receiver',
        subtitle: 'L4',
        icon: Radio,
        component: <EmittersReceiver />,
    },
    {
        id: 'scheduler',
        title: 'Scheduler Panel',
        subtitle: 'L5',
        icon: Calendar,
        component: <Scheduler />,
    },
    {
        id: 'ws',
        title: 'WS & Live Grid',
        subtitle: 'L6',
        icon: Terminal,
        component: <WSHarness />,
    },
    {
        id: 'models',
        title: 'Models & Training',
        subtitle: 'L7',
        icon: Cpu,
        component: <ModelsTraining />,
    },
    {
        id: 'experiments',
        title: 'Experiments',
        subtitle: 'L8',
        icon: FlaskConical,
        component: <Experiments />,
    },
    {
        id: 'metrics',
        title: 'Metrics Dumps',
        subtitle: 'L9',
        icon: BarChart3,
        component: <Metrics />,
    },
    {
        id: 'regression',
        title: 'Regression Pass',
        subtitle: 'L10',
        icon: CheckCircle2,
        component: <RegressionPass />,
    },
];

export function Dashboard() {
    const [activeTab, setActiveTab] = useState<string>('simulations');

    return (
        <div className="min-h-screen bg-[#090b0a] text-zinc-300 font-mono selection:bg-emerald-500/20 selection:text-emerald-300">
            
            {/* Minimal Header */}
            <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#090b0a]/90 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
                            <RadioTower className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] tracking-wider text-zinc-500 uppercase font-semibold">
                                    DRDO // LRDE
                                </span>
                                <span className="text-zinc-700">/</span>
                                <span className="inline-flex items-center gap-1 text-[9px] text-amber-500/90 font-medium">
                                    <Lock className="w-2.5 h-2.5" /> SIMULATION
                                </span>
                            </div>
                            <h1 className="text-xs font-bold text-zinc-100 tracking-tight uppercase">
                                RF Spectrum Strategy Test Harness
                            </h1>
                        </div>
                    </div>

                    <div className="text-[11px] text-zinc-500 hidden sm:block">
                        ASTRA_SUITE // V2.4
                    </div>

                </div>
            </header>

            {/* Main Layout Container */}
            <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">

                {/* Quick Navigation Cards */}
                <section>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                        {SECTIONS.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeTab === section.id;

                            return (
                                <a
                                    key={section.id}
                                    href={`#${section.id}`}
                                    onClick={() => setActiveTab(section.id)}
                                    className={`p-3 rounded border transition-all flex flex-col justify-between group ${
                                        isActive 
                                            ? 'bg-zinc-900/90 border-emerald-500/50 text-zinc-100 shadow-sm' 
                                            : 'bg-zinc-950/40 border-zinc-900 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                                        <span className="text-[9px] font-mono text-zinc-600">
                                            {section.subtitle}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-medium leading-tight truncate">
                                        {section.title}
                                    </span>
                                </a>
                            );
                        })}
                    </div>
                </section>

                {/* Radar Display Viewport */}
                <section>
                    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-6 flex justify-center items-center shadow-inner">
                        <Radar />
                    </div>
                </section>

                {/* Subsystem Component Sections */}
                <div className="space-y-12">
                    {SECTIONS.map((section) => {
                        const Icon = section.icon;

                        return (
                            <section
                                key={section.id}
                                id={section.id}
                                className="scroll-mt-24 space-y-4"
                            >
                                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <Icon className="w-4 h-4 text-emerald-400" />
                                        <h2 className="text-xs font-bold text-zinc-200 tracking-wider uppercase">
                                            {section.title}
                                        </h2>
                                        <span className="text-[9px] text-zinc-500 font-mono">
                                            [{section.subtitle}]
                                        </span>
                                    </div>
                                    <a 
                                        href={`#${section.id}`} 
                                        className="text-[10px] text-zinc-600 hover:text-zinc-400 flex items-center gap-0.5"
                                    >
                                        REF <ArrowUpRight className="w-3 h-3" />
                                    </a>
                                </div>

                                <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-6">
                                    {section.component}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* Minimal Footer */}
                <footer className="pt-8 pb-12 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-600 gap-4">
                    <div>
                        Software simulation test harness. Isolated from physical hardware.
                    </div>
                    <div>
                        DRDO LRDE © {new Date().getFullYear()}
                    </div>
                </footer>

            </main>
        </div>
    );
}