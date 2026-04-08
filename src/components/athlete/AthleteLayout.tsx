'use client'

import { useState } from 'react'
import AthleteOverview from './AthleteOverview'
import AthleteProfileForm from './AthleteProfileForm'
import AthleteBrandForm from './AthleteBrandForm'
import AthletePillars from './AthletePillars'
import AthleteStrategy from './AthleteStrategy'
import AthleteContentPlan from './AthleteContentPlan'
import AthleteLibrary from './AthleteLibrary'
import AthleteSettings from './AthleteSettings'
import type { AthleteStrategyObject } from '@/src/lib/athleteStrategy'
import type { AthleteContentPlanObject } from '@/src/lib/athleteContentPlan'

type Project = {
  id: string
  name: string
  mode: string | null
  type: string | null
  description: string | null
}

type AthleteData = {
  athlete_profile?: Record<string, string>
  athlete_brand?: Record<string, string>
  athlete_pillars?: string[]
  athlete_strategy?: AthleteStrategyObject
  athlete_contentPlan?: AthleteContentPlanObject
}

const navItems = [
  { key: 'overview', label: 'Overview' },
  { key: 'profile', label: 'Athlete Profile' },
  { key: 'brand', label: 'Brand Identity' },
  { key: 'pillars', label: 'Content Pillars' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'content-plan', label: 'Content Plan' },
  { key: 'library', label: 'Library' },
  { key: 'settings', label: 'Settings' },
] as const

type NavKey = (typeof navItems)[number]['key']

export default function AthleteLayout({
  project,
  athleteData,
}: {
  project: Project
  athleteData: AthleteData | null
  contentItems?: unknown[]
  plans?: unknown[]
}) {
  const [active, setActive] = useState<NavKey>('overview')
  const [profile, setProfile] = useState<Record<string, string> | null>(athleteData?.athlete_profile || null)
  const [brand, setBrand] = useState<Record<string, string> | null>(athleteData?.athlete_brand || null)
  const [pillars, setPillars] = useState<string[] | null>(athleteData?.athlete_pillars || null)
  const [strategy, setStrategy] = useState<AthleteStrategyObject | null>(athleteData?.athlete_strategy || null)
  const [contentPlan, setContentPlan] = useState<AthleteContentPlanObject | null>(athleteData?.athlete_contentPlan || null)

  const profileComplete = !!(profile?.athlete_name && profile?.sport && profile?.primary_goal && profile?.target_audience)
  const brandComplete = !!(profile && brand?.personality_type && brand?.brand_vibe)
  const pillarsComplete = !!(pillars && pillars.length >= 3)
  const strategyGenerated = !!(strategy?.generated)
  const strategyApproved = !!(strategy?.approved)
  const planGenerated = !!(contentPlan?.generated)
  const [initialContentPlanItemId, setInitialContentPlanItemId] = useState<string | null>(null)

  const navigateToItem = (itemId: string) => {
    setInitialContentPlanItemId(itemId)
    setActive('content-plan')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Horizontal tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        borderBottom: '1px solid var(--border-subtle)', padding: '0 28px', flexShrink: 0, overflowX: 'auto',
      }}>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setActive(item.key)}
            style={{
              padding: '8px 14px', fontSize: '13px',
              fontWeight: active === item.key ? 600 : 400,
              color: active === item.key ? '#eef1f6' : 'rgba(255,255,255,0.55)',
              background: 'transparent', border: 'none',
              borderBottom: active === item.key ? '2px solid #5a9af5' : '2px solid transparent',
              cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap', marginBottom: '-1px', fontFamily: 'inherit',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, minWidth: 0, padding: '20px 28px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {active === 'overview' && (
          <AthleteOverview
            project={project}
            profile={profile}
            brand={brand}
            pillars={pillars}
            profileComplete={profileComplete}
            brandComplete={brandComplete}
            pillarsComplete={pillarsComplete}
            strategyGenerated={strategyGenerated}
            strategyApproved={strategyApproved}
            strategyData={strategy?.data || null}
            planGenerated={planGenerated}
            contentPlan={contentPlan}
            onNavigate={setActive}
            onNavigateToItem={navigateToItem}
          />
        )}
        {active === 'profile' && (
          <AthleteProfileForm projectId={project.id} initialData={profile} onSave={setProfile} />
        )}
        {active === 'brand' && (
          <AthleteBrandForm projectId={project.id} initialData={brand} onSave={setBrand} />
        )}
        {active === 'pillars' && (
          <AthletePillars projectId={project.id} initialPillars={pillars} onSave={setPillars} />
        )}
        {active === 'strategy' && (
          <AthleteStrategy
            projectId={project.id}
            profile={profile}
            brand={brand}
            pillars={pillars}
            profileComplete={profileComplete}
            brandComplete={brandComplete}
            pillarsComplete={pillarsComplete}
            initialStrategy={strategy}
            onNavigate={setActive}
            onStrategyChange={setStrategy}
          />
        )}
        {active === 'content-plan' && (
          <AthleteContentPlan
            projectId={project.id}
            strategyGenerated={strategyGenerated}
            strategyApproved={strategyApproved}
            strategyData={strategy?.data || null}
            profile={profile}
            pillars={pillars}
            initialPlan={contentPlan}
            initialSelectedId={initialContentPlanItemId}
            onNavigate={setActive}
            onPlanChange={setContentPlan}
          />
        )}
        {active === 'library' && (
          <AthleteLibrary
            projectId={project.id}
            contentPlan={contentPlan}
            onNavigate={setActive}
            onPlanChange={setContentPlan}
          />
        )}
        {active === 'settings' && (
          <AthleteSettings
            projectId={project.id}
            profile={profile}
            brand={brand}
            pillars={pillars}
            strategy={strategy}
            contentPlan={contentPlan}
            profileComplete={profileComplete}
            brandComplete={brandComplete}
            pillarsComplete={pillarsComplete}
            strategyGenerated={strategyGenerated}
            strategyApproved={strategyApproved}
            planGenerated={planGenerated}
            onStrategyChange={setStrategy}
            onContentPlanChange={setContentPlan}
          />
        )}
      </div>
    </div>
  )
}
