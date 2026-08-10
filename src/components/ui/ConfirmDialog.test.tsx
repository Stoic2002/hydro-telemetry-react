import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog';

function renderDialog(overrides: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) {
  const props: React.ComponentProps<typeof ConfirmDialog> = {
    isOpen: true,
    title: 'Hapus pengguna?',
    description: 'Tindakan ini tidak dapat dibatalkan.',
    confirmLabel: 'Hapus',
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };

  return { props, ...render(<ConfirmDialog {...props} />) };
}

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    renderDialog({ isOpen: false });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('renders accessible content and confirms the action', async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();

    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Hapus pengguna?');
    expect(screen.getByText('Tindakan ini tidak dapat dibatalkan.')).toBeVisible();
    expect(document.body).toHaveStyle({ overflow: 'hidden' });

    await user.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(props.onConfirm).toHaveBeenCalledOnce();
  });

  it('closes with Escape unless confirmation is in progress', () => {
    const { props, rerender } = renderDialog();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledOnce();

    rerender(<ConfirmDialog {...props} isConfirming />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(props.onClose).toHaveBeenCalledOnce();
  });
});

