import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { useAccessibleMessage } from './AccessibleStatusAnnouncer'

function Announcer() {
  const { announcer, notify } = useAccessibleMessage()

  return (
    <>
      <button type="button" onClick={() => notify.success('Auditoria concluída.')}>
        Concluir
      </button>
      <button type="button" onClick={() => notify.error('Não foi possível auditar a página.')}>
        Falhar
      </button>
      {announcer}
    </>
  )
}

describe('useAccessibleMessage', () => {
  it('announces confirmations politely', async () => {
    render(<Announcer />)

    await userEvent.click(screen.getByRole('button', { name: 'Concluir' }))

    const status = screen.getByRole('status')
    expect(status.textContent).toBe('Auditoria concluída.')
    expect(status.getAttribute('aria-live')).toBe('polite')
  })

  it('interrupts with errors', async () => {
    render(<Announcer />)

    await userEvent.click(screen.getByRole('button', { name: 'Falhar' }))

    const alert = screen.getByRole('alert')
    expect(alert.textContent).toBe('Não foi possível auditar a página.')
    expect(alert.getAttribute('aria-live')).toBe('assertive')
  })
})
