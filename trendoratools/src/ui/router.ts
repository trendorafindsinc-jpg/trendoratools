export function currentRoute(): string {
  const hash = window.location.hash || '#/home';
  return hash.split('?')[0];
}

export function navigate(hash: string): void {

 window.location.hash = hash;
}
