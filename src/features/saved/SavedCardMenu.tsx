import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { Button, Icon } from '../../components/ui';
import styles from './SavedCardMenu.module.css';

interface SavedCardMenuProps {
  buildName: string;
  hideButton: boolean;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onRename: () => void;
  onDuplicate: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export function SavedCardMenu({
  buildName,
  hideButton,
  buttonRef,
  onRename,
  onDuplicate,
  onDownload,
  onDelete,
}: SavedCardMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const startFromEndRef = useRef(false);
  const label = `Действия со сборкой «${buildName}»`;

  function getItems(): HTMLButtonElement[] {
    const menu = menuRef.current;
    return menu ? Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')) : [];
  }

  useEffect(() => {
    if (!open) return;
    const items = getItems();
    items[startFromEndRef.current ? items.length - 1 : 0]?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && wrapRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  function openMenu(fromEnd: boolean) {
    startFromEndRef.current = fromEnd;
    setOpen(true);
  }

  function closeMenu(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  function moveFocus(step: number) {
    const items = getItems();
    const index = items.findIndex((item) => item === document.activeElement);
    items[(index + step + items.length) % items.length]?.focus();
  }

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(event.key === 'ArrowUp');
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const items = getItems();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === 'Tab') {
      closeMenu(false);
    }
  }

  function runAction(action: () => void) {
    closeMenu(true);
    action();
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <Button
        ref={buttonRef}
        className={styles.button}
        variant="icon"
        icon="more"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        hidden={hideButton}
        onClick={() => (open ? closeMenu(true) : openMenu(false))}
        onKeyDown={handleButtonKeyDown}
      />
      <ul
        className={styles.menu}
        id={menuId}
        ref={menuRef}
        role="menu"
        aria-label={label}
        hidden={!open}
        onKeyDown={handleMenuKeyDown}
      >
        <li role="none">
          <button type="button" role="menuitem" tabIndex={-1} onClick={() => runAction(onRename)}>
            <Icon name="edit" />
            <span>Переименовать</span>
          </button>
        </li>
        <li role="none">
          <button type="button" role="menuitem" tabIndex={-1} onClick={() => runAction(onDuplicate)}>
            <Icon name="copy" />
            <span>Дублировать</span>
          </button>
        </li>
        <li role="none">
          <button type="button" role="menuitem" tabIndex={-1} onClick={() => runAction(onDownload)}>
            <Icon name="download" />
            <span>Скачать список</span>
          </button>
        </li>
        <li role="none">
          <button
            className={styles.danger}
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => runAction(onDelete)}
          >
            <Icon name="trash" />
            <span>Удалить</span>
          </button>
        </li>
      </ul>
    </div>
  );
}
