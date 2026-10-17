'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Film, Bot, CheckCircle2, ArrowRight, Play, Settings } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    channelName: 'BharatToon History',
    niche: 'Indian History + Culture',
    targetAudience: 'Youth & General Indian Audience',
    primaryLanguage: 'Hinglish',
    secondaryLanguage: 'English Subtitles',
    animationStyle: 'Modern 2D Indian Cartoon',
    postingFrequency: '1 Reel / Day',
    platforms: ['Instagram Reels', 'YouTube Shorts'],
    growthGoal: '100,000 Followers in 6 Months'
  })

  const nextStep = () => {
    if (step < 10) setStep(step + 1)
    else handleStartAI()
  }

  const handleStartAI = async () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6 border-b border-slate-800 pb-4">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">BharatToon AI</h1>
            <p className="text-sm text-slate-400">Autonomous AI Animation Studio for India</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full mb-8 overflow-hidden">
          <div
            className="bg-orange-500 h-full transition-all duration-300"
            style={{ width: `${(step / 10) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Step 1: Channel Name</label>
              <input
                type="text"
                value={formData.channelName}
                onChange={(e) => setFormData({ ...formData, channelName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                placeholder="e.g. BharatToon AI"
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Step 2: Choose Niche</label>
              <select
                value={formData.niche}
                onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="Indian History + Culture">Indian History + Culture</option>
                <option value="Indian Monuments & Architecture">Indian Monuments & Architecture</option>
                <option value="Indian Festivals & Traditions">Indian Festivals & Traditions</option>
                <option value="Indian Science & Space Achievements">Indian Science & Space Achievements</option>
              </select>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Step 3: Target Audience</label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          {step === 4 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Step 4: Narration & Subtitle Language</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Primary Language</span>
                  <input
                    type="text"
                    value={formData.primaryLanguage}
                    onChange={(e) => setFormData({ ...formData, primaryLanguage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-400">Secondary Subtitle</span>
                  <input
                    type="text"
                    value={formData.secondaryLanguage}
                    onChange={(e) => setFormData({ ...formData, secondaryLanguage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Step 5: Animation Style</label>
              <input
                type="text"
                value={formData.animationStyle}
                onChange={(e) => setFormData({ ...formData, animationStyle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
              />
            </div>
          )}

          {step === 6 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Step 6: Posting Frequency</label>
              <select
                value={formData.postingFrequency}
                onChange={(e) => setFormData({ ...formData, postingFrequency: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
              >
                <option value="1 Reel / Day">1 Reel / Day (Recommended)</option>
                <option value="2 Reels / Day">2 Reels / Day</option>
                <option value="3 Reels / Week">3 Reels / Week</option>
              </select>
            </div>
          )}

          {step === 7 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Step 7: Platforms</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <CheckCircle2 className="text-emerald-400 w-5 h-5" />
                  <span className="text-white text-sm">Instagram Reels (Official Graph API)</span>
                </div>
                <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <CheckCircle2 className="text-emerald-400 w-5 h-5" />
                  <span className="text-white text-sm">YouTube Shorts (Official Data API v3)</span>
                </div>
              </div>
            </div>
          )}

          {step === 8 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Step 8: Growth Goal</label>
              <input
                type="text"
                value={formData.growthGoal}
                onChange={(e) => setFormData({ ...formData, growthGoal: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white"
              />
            </div>
          )}

          {step === 9 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Step 9: Official Platform Authorization</label>
              <p className="text-sm text-slate-400 mb-4">
                Connect official OAuth apps for publishing, or use internal queue mode with automated notifications.
              </p>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs text-amber-400">✔ Official APIs & Fallbacks Configured</div>
                <div className="text-xs text-slate-400">Zero scraping, zero CAPTCHA bypass, 100% platform compliant.</div>
              </div>
            </div>
          )}

          {step === 10 && (
            <div className="text-center py-6">
              <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-full mb-4">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Your AI Animation Studio is Ready</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                BharatToon AI will now continuously research topics, fact-check, generate scripts, render animations, and manage your content queue.
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-800">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-xl"
              >
                Back
              </button>
            ) : <div />}

            <button
              onClick={nextStep}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium text-sm rounded-xl flex items-center space-x-2 transition"
            >
              <span>{step === 10 ? (loading ? 'Launching AI Studio...' : 'Start AI Studio') : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
