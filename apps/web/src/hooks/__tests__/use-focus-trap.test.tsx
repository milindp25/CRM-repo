import { render, screen, fireEvent } from '@testing-library/react';
import { useRef } from 'react';
import { useFocusTrap } from '../use-focus-trap';

// Test component with multiple focusable elements
function FocusTrapTestComponent({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, enabled);

  return (
    <div ref={ref} data-testid="trap-container">
      <button data-testid="btn-1">First</button>
      <button data-testid="btn-2">Second</button>
      <button data-testid="btn-3">Third</button>
    </div>
  );
}

// Test component with no focusable elements
function EmptyFocusTrapComponent({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, enabled);
  return <div ref={ref} data-testid="empty-container"><span>No buttons here</span></div>;
}

// Test component that can toggle enabled state
function ToggleableFocusTrapComponent({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, enabled);

  return (
    <div>
      <button data-testid="outside-btn">Outside</button>
      <div ref={ref} data-testid="trap-container">
        <input data-testid="input-1" type="text" placeholder="Input 1" />
        <a href="#" data-testid="link-1">Link</a>
        <button data-testid="inner-btn">Inner Button</button>
      </div>
    </div>
  );
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('moves focus to first focusable element when enabled', async () => {
    render(<FocusTrapTestComponent enabled={true} />);

    // The hook uses requestAnimationFrame to focus the first element
    // Simulate rAF callback
    jest.runAllTimers();
    await Promise.resolve(); // flush microtasks

    // requestAnimationFrame may not be fully simulated by fake timers
    // so we use a real rAF flush
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    // With jsdom, rAF fires synchronously in some configurations
    // The first focusable element should eventually receive focus
    expect(screen.getByTestId('btn-1')).toHaveFocus();
  });

  it('does not move focus when disabled', () => {
    render(<FocusTrapTestComponent enabled={false} />);
    jest.runAllTimers();
    expect(screen.getByTestId('btn-1')).not.toHaveFocus();
  });

  it('traps Tab at last element by wrapping to first', () => {
    render(<FocusTrapTestComponent enabled={true} />);
    jest.runAllTimers();

    const container = screen.getByTestId('trap-container');
    const btn3 = screen.getByTestId('btn-3');
    const btn1 = screen.getByTestId('btn-1');

    // Focus the last button
    btn3.focus();
    expect(btn3).toHaveFocus();

    // Press Tab on last element - should wrap to first
    fireEvent.keyDown(container, { key: 'Tab', shiftKey: false });
    expect(btn1).toHaveFocus();
  });

  it('traps Shift+Tab at first element by wrapping to last', () => {
    render(<FocusTrapTestComponent enabled={true} />);
    jest.runAllTimers();

    const container = screen.getByTestId('trap-container');
    const btn1 = screen.getByTestId('btn-1');
    const btn3 = screen.getByTestId('btn-3');

    // Focus the first button
    btn1.focus();
    expect(btn1).toHaveFocus();

    // Press Shift+Tab on first element - should wrap to last
    fireEvent.keyDown(container, { key: 'Tab', shiftKey: true });
    expect(btn3).toHaveFocus();
  });

  it('does not interfere with Tab in the middle of the list', () => {
    render(<FocusTrapTestComponent enabled={true} />);
    jest.runAllTimers();

    const container = screen.getByTestId('trap-container');
    const btn2 = screen.getByTestId('btn-2');

    // Focus the middle button
    btn2.focus();
    expect(btn2).toHaveFocus();

    // Press Tab on middle element - should NOT prevent default (browser handles it)
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    container.dispatchEvent(event);
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('handles containers with no focusable elements gracefully', () => {
    expect(() => {
      render(<EmptyFocusTrapComponent enabled={true} />);
      jest.runAllTimers();
    }).not.toThrow();
  });

  it('ignores non-Tab key events', () => {
    render(<FocusTrapTestComponent enabled={true} />);
    jest.runAllTimers();

    const container = screen.getByTestId('trap-container');
    const btn1 = screen.getByTestId('btn-1');
    btn1.focus();

    // Press a non-Tab key - should not affect focus
    fireEvent.keyDown(container, { key: 'Enter' });
    expect(btn1).toHaveFocus();
  });

  it('works with different focusable element types', () => {
    render(<ToggleableFocusTrapComponent enabled={true} />);
    jest.runAllTimers();

    const container = screen.getByTestId('trap-container');
    const innerBtn = screen.getByTestId('inner-btn');
    const input1 = screen.getByTestId('input-1');

    // Focus the last focusable element inside the trap
    innerBtn.focus();
    expect(innerBtn).toHaveFocus();

    // Press Tab - should wrap to first focusable (input-1)
    fireEvent.keyDown(container, { key: 'Tab', shiftKey: false });
    expect(input1).toHaveFocus();
  });

  it('re-queries focusable elements dynamically on each keydown', () => {
    const { rerender } = render(<FocusTrapTestComponent enabled={true} />);
    jest.runAllTimers();

    // The hook calls focusableElements() inside the keydown handler,
    // so it re-queries each time. Just verify it doesn't throw after rerender.
    rerender(<FocusTrapTestComponent enabled={true} />);
    jest.runAllTimers();

    const container = screen.getByTestId('trap-container');
    const btn3 = screen.getByTestId('btn-3');
    btn3.focus();

    // Should still work after rerender
    fireEvent.keyDown(container, { key: 'Tab' });
    expect(screen.getByTestId('btn-1')).toHaveFocus();
  });
});
