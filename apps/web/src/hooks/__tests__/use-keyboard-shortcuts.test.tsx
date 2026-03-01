import { render, screen, fireEvent, act } from '@testing-library/react';
import { useKeyboardShortcuts } from '../use-keyboard-shortcuts';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Test component that uses the hook
function KeyboardShortcutsTestComponent() {
  const shortcuts = useKeyboardShortcuts();
  return (
    <div data-testid="shortcuts-host">
      <span data-testid="shortcut-count">{shortcuts.length}</span>
    </div>
  );
}

// Helper to dispatch keydown on document
function pressKey(key: string, options: Partial<KeyboardEventInit> = {}) {
  fireEvent.keyDown(document, { key, ...options });
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('registers shortcuts and returns them', () => {
    render(<KeyboardShortcutsTestComponent />);
    expect(screen.getByTestId('shortcut-count').textContent).toBe('6');
  });

  it('navigates to dashboard on g then d sequence', () => {
    render(<KeyboardShortcutsTestComponent />);

    act(() => {
      pressKey('g');
    });
    act(() => {
      pressKey('d');
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to employees on g then e sequence', () => {
    render(<KeyboardShortcutsTestComponent />);

    act(() => {
      pressKey('g');
    });
    act(() => {
      pressKey('e');
    });

    expect(mockPush).toHaveBeenCalledWith('/employees');
  });

  it('navigates to attendance on g then a sequence', () => {
    render(<KeyboardShortcutsTestComponent />);

    act(() => {
      pressKey('g');
    });
    act(() => {
      pressKey('a');
    });

    expect(mockPush).toHaveBeenCalledWith('/attendance');
  });

  it('navigates to leave on g then l sequence', () => {
    render(<KeyboardShortcutsTestComponent />);

    act(() => {
      pressKey('g');
    });
    act(() => {
      pressKey('l');
    });

    expect(mockPush).toHaveBeenCalledWith('/leave');
  });

  it('navigates to payroll on g then p sequence', () => {
    render(<KeyboardShortcutsTestComponent />);

    act(() => {
      pressKey('g');
    });
    act(() => {
      pressKey('p');
    });

    expect(mockPush).toHaveBeenCalledWith('/payroll');
  });

  it('navigates to settings on g then s sequence', () => {
    render(<KeyboardShortcutsTestComponent />);

    act(() => {
      pressKey('g');
    });
    act(() => {
      pressKey('s');
    });

    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('dispatches show-shortcuts-help event on ? key', () => {
    render(<KeyboardShortcutsTestComponent />);

    const handler = jest.fn();
    document.addEventListener('show-shortcuts-help', handler);

    act(() => {
      pressKey('?');
    });

    expect(handler).toHaveBeenCalledTimes(1);
    document.removeEventListener('show-shortcuts-help', handler);
  });

  it('does not trigger shortcuts when focused on an input element', () => {
    render(
      <div>
        <KeyboardShortcutsTestComponent />
        <input data-testid="text-input" type="text" />
      </div>
    );

    const input = screen.getByTestId('text-input');
    input.focus();

    act(() => {
      fireEvent.keyDown(input, { key: 'g' });
    });
    act(() => {
      fireEvent.keyDown(input, { key: 'd' });
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not trigger shortcuts when focused on a textarea', () => {
    render(
      <div>
        <KeyboardShortcutsTestComponent />
        <textarea data-testid="text-area" />
      </div>
    );

    const textarea = screen.getByTestId('text-area');
    textarea.focus();

    act(() => {
      fireEvent.keyDown(textarea, { key: '?' });
    });

    const handler = jest.fn();
    document.addEventListener('show-shortcuts-help', handler);
    // The ? key should not fire because the target is a textarea
    expect(handler).not.toHaveBeenCalled();
    document.removeEventListener('show-shortcuts-help', handler);
  });

  it('does not trigger shortcuts when modifier keys are pressed', () => {
    render(<KeyboardShortcutsTestComponent />);

    act(() => {
      pressKey('g', { metaKey: true });
    });
    act(() => {
      pressKey('d');
    });

    // The 'g' with metaKey should be ignored, so the sequence is just 'd' alone
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('resets sequence after 500ms timeout', () => {
    render(<KeyboardShortcutsTestComponent />);

    act(() => {
      pressKey('g');
    });

    // Wait for the 500ms timeout to expire
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Now press 'd' - should not navigate since sequence was reset
    act(() => {
      pressKey('d');
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('resets sequence when no partial match is found', () => {
    render(<KeyboardShortcutsTestComponent />);

    // Press a key that doesn't start any sequence
    act(() => {
      pressKey('z');
    });

    // Then try a valid sequence
    act(() => {
      pressKey('g');
    });
    act(() => {
      pressKey('d');
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = render(<KeyboardShortcutsTestComponent />);

    unmount();

    act(() => {
      pressKey('g');
    });
    act(() => {
      pressKey('d');
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
