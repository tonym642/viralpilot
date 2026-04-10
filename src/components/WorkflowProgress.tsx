'use client'

import { WORKFLOW_STEPS, getStepStates, type WorkflowCompletion, type StepState } from '@/src/lib/workflowConfig'

export default function WorkflowProgress({ completion }: { completion: WorkflowCompletion }) {
  const states = getStepStates(completion)
  const currentIdx = states.indexOf('current')
  const currentStep = currentIdx >= 0 ? WORKFLOW_STEPS[currentIdx] : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', flexShrink: 0 }}>
      {/* Step label */}
      {currentStep && (
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '10px', whiteSpace: 'nowrap' }}>
          Step {currentStep.num} of 5
        </span>
      )}

      {/* Circles + connectors */}
      {WORKFLOW_STEPS.map((step, i) => {
        const state = states[i]
        return (
          <div key={step.num} style={{ display: 'flex', alignItems: 'center' }}>
            {i > 0 && <Connector left={states[i - 1]} right={state} />}
            <Circle num={step.num} state={state} label={step.label} />
          </div>
        )
      })}
    </div>
  )
}

function Circle({ num, state, label }: { num: number; state: StepState; label: string }) {
  const isCurrent = state === 'current'
  const isCompleted = state === 'completed'

  return (
    <div
      title={label}
      style={{
        width: '24px', height: '24px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', fontWeight: 700, flexShrink: 0,
        background: isCompleted ? '#4ade80' : 'rgba(255,255,255,0.18)',
        border: 'none',
        color: isCompleted ? '#0a1a0f' : 'rgba(255,255,255,0.5)',
        transition: 'all 0.2s',
      }}
    >
      {num}
    </div>
  )
}

function Connector({ left, right }: { left: StepState; right: StepState }) {
  const done = left === 'completed' && right === 'completed'
  return (
    <div style={{
      width: '20px', height: '2px',
      background: done ? '#4ade80' : 'rgba(255,255,255,0.08)',
      transition: 'background 0.2s',
    }} />
  )
}
