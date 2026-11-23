const fs = require('fs');
let content = fs.readFileSync('mockup_pastas/app/routes/ventas/remitos.tsx', 'utf8');

const targetRegex = /<p><span className="font-medium">Direcci.*n predeterminada:<\/span> \{\[selectedClient\.address, selectedClient\.locality\]\.filter\(Boolean\)\.join\(", "\) \|\| "N\/A"\}<\/p>/g;
const match = content.match(targetRegex);
console.log(match ? "FOUND" : "NOT FOUND");
if (match) {
  content = content.replace(targetRegex, match[0] + '\n                  {orderId && SAMPLE_ORDERS.find(o => o.id === orderId)?.deliveryAddressType === "custom" && <p className="mt-2 text-purple-700 font-medium">Entrega en domicilio alternativo: {SAMPLE_ORDERS.find(o => o.id === orderId)?.customDeliveryAddress}</p>}');
  fs.writeFileSync('mockup_pastas/app/routes/ventas/remitos.tsx', content, 'utf8');
}
