import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import { joinClasses } from './joinClasses';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'light' | 'done' | 'icon';
type ButtonSize = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  block?: boolean;
  wrap?: boolean;
}

function wrapText(children: ReactNode) {
  if (typeof children === 'string' || typeof children === 'number') {
    return <span>{children}</span>;
  }
  return children;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'quiet', size = 'md', icon, block = false, wrap = false, type = 'button', className, children, ...props },
  ref,
) {
  if (variant === 'icon') {
    return (
      <button ref={ref} type={type} className={joinClasses(styles.iconButton, className)} {...props}>
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
    wrap && styles.wrap,
    className,
  );

  return (
    <button ref={ref} type={type} className={classes} {...props}>
      {icon && <Icon name={icon} />}
      {wrapText(children)}
    </button>
  );
});

interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: string;
}

export function TextLink({ icon, className, children, ...props }: TextLinkProps) {
  return (
    <a className={joinClasses(styles.link, className)} {...props}>
      {icon && <Icon name={icon} />}
      {children}
    </a>
  );
}

interface LinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
}

export const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(function LinkButton(
  { icon, type = 'button', className, children, ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={joinClasses(styles.link, className)} {...props}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
});
