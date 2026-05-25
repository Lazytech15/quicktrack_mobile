import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Equipment, EquipmentLog } from '../db/queries';
import { format } from 'date-fns';

export const generateEquipmentReport = async (
  equipment: Equipment,
  logs: EquipmentLog[]
): Promise<void> => {
  const generatedAt = format(new Date(), 'PPPp');
  const lastChecked = equipment.last_checked
    ? format(new Date(equipment.last_checked), 'PPp')
    : 'Never';
  const nextDue = equipment.next_check_due
    ? format(new Date(equipment.next_check_due), 'PPp')
    : 'Not scheduled';

  const statusColor = {
    active: '#1D9E75',
    maintenance: '#EF9F27',
    offline: '#E24B4A',
    decommissioned: '#888780',
  }[equipment.status] ?? '#888780';

  const logsHtml = logs.map(log => {
    const photos = log.photos ? JSON.parse(log.photos) as string[] : [];
    const photoHtml = photos.length > 0
      ? `<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
          ${photos.map(p => `<img src="${p}" style="width:120px;height:90px;object-fit:cover;border-radius:6px;border:1px solid #e5e5e5;" />`).join('')}
         </div>`
      : '';

    return `
      <div style="border:1px solid #e5e5e5;border-radius:8px;padding:12px 16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div>
            <span style="font-weight:600;font-size:14px;">${log.technician}</span>
            <span style="margin-left:10px;background:#E1F5EE;color:#0F6E56;padding:2px 10px;border-radius:100px;font-size:12px;">${log.status}</span>
          </div>
          <span style="font-size:12px;color:#888;">${format(new Date(log.created_at), 'PPp')}</span>
        </div>
        ${log.notes ? `<p style="margin:0;font-size:13px;color:#555;">${log.notes}</p>` : ''}
        ${photoHtml}
        <div style="margin-top:8px;font-size:11px;color:#aaa;">${log.synced ? '✓ Synced to server' : '⏳ Pending sync'}</div>
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Equipment Report — ${equipment.name}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: -apple-system, sans-serif; margin: 0; padding: 24px; color: #1a1a1a; }
          h1 { font-size: 22px; margin: 0 0 4px; }
          h2 { font-size: 16px; color: #555; margin: 24px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
          .header { background: #f8f8f6; border-radius: 10px; padding: 20px; margin-bottom: 24px; }
          .badge { display:inline-block; padding: 3px 12px; border-radius: 100px; font-size: 12px; font-weight: 600; color: white; background: ${statusColor}; }
          .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:16px; }
          .meta-item label { font-size:11px; color:#999; text-transform:uppercase; letter-spacing:.05em; display:block; margin-bottom:3px; }
          .meta-item span { font-size:13px; font-weight:500; }
          .footer { margin-top:32px; font-size:11px; color:#aaa; text-align:center; border-top:1px solid #eee; padding-top:16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${equipment.name}</h1>
          <div style="margin-top:6px;">
            <span class="badge">${equipment.status.toUpperCase()}</span>
            <span style="margin-left:10px;font-size:13px;color:#888;">${equipment.category}</span>
          </div>
          <div class="meta-grid">
            <div class="meta-item"><label>Location</label><span>${equipment.location}</span></div>
            <div class="meta-item"><label>Serial Number</label><span>${equipment.serial_number ?? 'N/A'}</span></div>
            <div class="meta-item"><label>Last Checked</label><span>${lastChecked}</span></div>
            <div class="meta-item"><label>Next Check Due</label><span>${nextDue}</span></div>
          </div>
          ${equipment.notes ? `<div style="margin-top:12px;font-size:13px;color:#555;"><strong>Notes:</strong> ${equipment.notes}</div>` : ''}
        </div>

        <h2>Service History (${logs.length} entries)</h2>
        ${logs.length > 0 ? logsHtml : '<p style="color:#aaa;font-size:13px;">No logs recorded yet.</p>'}

        <div class="footer">
          QuickTrack Mobile — Generated on ${generatedAt}
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Report — ${equipment.name}`,
    UTI: 'com.adobe.pdf',
  });
};
