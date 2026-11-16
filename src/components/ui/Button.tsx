import type { ComponentProps, ReactNode } from 'react';
import { Icon } from './Icon';
import { joinClasses } from './joinClasses';
import styles from './Button.module.css';

interface ButtonProps extends ComponentProps<'button'> {
  variant: 'primary' | 'secondary' | 'light' | 'done' | 'icon';
  size?: 'md' | 'sm';
  icon?: string;
  block?: boolean;
}

function wrapText(children: ReactNode) {
  if (typeof children === 'string' || typeof children === 'number') {
    return <span>{children}</span>;
  }
  return children;
}

export function Button({ variant, size = 'md', icon, block = false, type = 'button', className, children, ...props }: ButtonProps) {
  if (variant === 'icon') {
    return (
      <button type={type} className={joinClasses(styles.iconButton, className)} {...props}>
        {icon && <Icon name={icon} />}
        {children}
      </button>
    );
  }

  const classes = joinClasses(
    styles.button,
    styles[variant],
    size === 'sm' && styles.sm,
    block && styles.block,
    className,
  );

  return (
    <button type={type} className={classes} {...props}>
      {icon && <Icon name={icon} />}
      {wrapText(children)}
    </button>
  );
}

export function TextLink({ className, ...props }: ComponentProps<'a'>) {
  return <a className={joinClasses(styles.link, className)} {...props} />;
}

export function LinkButton({ type = 'button', className, ...props }: ComponentProps<'button'>) {
  return <button type={type} className={joinClasses(styles.link, className)} {...props} />;
}
