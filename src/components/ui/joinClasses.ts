export function joinClasses(...names: (string | false | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
