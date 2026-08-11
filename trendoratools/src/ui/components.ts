export function progressBar(percent: number): string {
 const safe = Math.min(100, Math.max(0, Math.round(percent)));
 const tone = percent >= 100 ? 'danger' : percent >= 80 ? 'warn' : 'safe';

  return `
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"
aria-valuenow="${safe}">
     <span class="progress-fill ${tone}" style="width:${safe}%"></span>
    </div>
  `;
}

export function emptyState(title: string, body: string, actionsHtml = ''): string {
  return `
    <div class="empty-state">
     <h3>${title}</h3>
     <p>${body}</p>
     ${actionsHtml ? `<div class="row">${actionsHtml}</div>` : ''}
    </div>
  `;
}
