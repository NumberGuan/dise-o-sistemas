const fs = require('fs');
let content = fs.readFileSync('mockup_pastas/app/routes/ventas/remitos.tsx', 'utf8');

const targetStr = '<p><span className="font-medium">Direcci\\u00f3n predeterminada:</span> {[selectedClient.address, selectedClient.locality].filter(Boolean).join(", ") || "N/A"}</p>';
const newStr = targetStr + '\n                  {orderId && SAMPLE_ORDERS.find(o => o.id === orderId)?.deliveryAddressType === "custom" && <p className="mt-2 text-purple-700 font-medium">Entrega en domicilio alternativo: {SAMPLE_ORDERS.find(o => o.id === orderId)?.customDeliveryAddress}</p>}';

content = content.replace(targetStr, newStr);
fs.writeFileSync('mockup_pastas/app/routes/ventas/remitos.tsx', content, 'utf8');
