import { joinClasses } from './joinClasses';
import styles from './Icon.module.css';

interface IconFile {
  body: string;
  strokeWidth: string;
}

const files = import.meta.glob<string>('../../assets/icons/[a-z]*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const icons = new Map<string, IconFile>();

for (const [path, svg] of Object.entries(files)) {
  const name = path.slice(path.lastIndexOf('/') + 1, -'.svg'.length);
  const body = svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'));
  const strokeWidth = svg.match(/stroke-width="([^"]+)"/)?.[1] ?? '1.6';
  icons.set(name, { body, strokeWidth });
}

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className }: IconProps) {
  const icon = icons.get(name);
  if (!icon) return null;

  return (
    <svg
      className={joinClasses(styles.icon, className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={icon.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}
