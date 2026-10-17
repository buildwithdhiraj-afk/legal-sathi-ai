'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles, Play, Pause, RefreshCw, CheckCircle2,
  TrendingUp, Users, Film, Eye, ShieldCheck, Zap
} from 'lucide-react'

export default function DashboardPage() {
  const [isPaused, setIsPaused] = useState(false)
  const [isRunningPipeline, setIsRunningPipeline] = useState(false)
  const [pipelineResult, setPipelineResult] = useState<any>(null)
  const [stats, setStats] = useState({
    followers: 12482,
    growth: '+8.4%',
    videos: 127,
    totalViews: '4.8M'
  })

  const togglePause = async () => {
    setIsPaused(!isPaused)
  }

  const triggerPipeline = async () => {
    setIsRunningPipeline(true)
    setTimeout(() => {
      setIsRunningPipeline(false)
      setPipelineResult({
        topic: 'Why Mumbai Has Seven Islands',
        score: '92/100',
        scriptTitle: 'Why Mumbai Has 7 Islands',
        qualityPassed: true
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Top Navbar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 mb-8 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/20">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">BHARATTOON AI</h1>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isPaused ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {isPaused ? '🟡 Paused' : '🟢 Autonomous'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Autonomous AI Animation Studio for India</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={triggerPipeline}
            disabled={isRunningPipeline}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition shadow-lg shadow-orange-500/20"
          >
            <Zap className="w-4 h-4" />
            <span>{isRunningPipeline ? 'AI Producing Reel...' : 'Trigger AI Reel Generation'}</span>
          </button>

          <button
            onClick={togglePause}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'RESUME AUTOMATION' : 'PAUSE ALL AUTOMATION'}</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Followers</span>
            <Users className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.followers.toLocaleString()}</div>
          <div className="text-xs text-emerald-400 font-medium mt-1">Growth {stats.growth}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Views</span>
            <Eye className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalViews}</div>
          <div className="text-xs text-slate-400 font-medium mt-1">Across Shorts & Reels</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Videos Rendered</span>
            <Film className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats.videos}</div>
          <div className="text-xs text-emerald-400 font-medium mt-1">100% Fact Checked</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Content Score</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">92 / 100</div>
          <div className="text-xs text-slate-400 font-medium mt-1">High Quality Threshold Passed</div>
        </div>
      </div>

      {/* Pipeline & AI Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - Today's Automated Routine */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>TODAY'S PRODUCTION PIPELINE</span>
            </h2>
            <span className="text-xs text-slate-400">Scheduled: 18:00 IST</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-slate-200">Topic Selected: "How Mumbai Became a City of Seven Islands"</span>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">Score 91/100</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-slate-200">Research & Fact Checking (3 Claims Verified)</span>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">ASI Verified</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-slate-200">Hinglish Script & Scene Storyboard Generated</span>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">45 sec</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-slate-200">2D Animation & Audio Ducking Rendered (FFmpeg)</span>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">1080x1920 MP4</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-slate-200">Quality Check Passed & Reel Scheduled</span>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">Ready to Publish</span>
            </div>
          </div>

          {/* Next Video rendering progress */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex justify-between items-center text-sm font-medium mb-2">
              <span className="text-slate-300">NEXT VIDEO IN PRODUCTION: "How Kolkata Got Its Name"</span>
              <span className="text-orange-400 font-mono">82%</span>
            </div>
            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full w-[82%] rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Column - AI Insights & Agent Status */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI STRATEGY INSIGHT</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              "Historical city origin stories are currently your strongest content category, generating 3.4x higher share rates."
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">AGENT STATUS CENTER</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">TopicAgent</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">FactCheckAgent</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">ScriptAgent</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">AnimationAgent</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">QualityAgent</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">PublishingAgent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
