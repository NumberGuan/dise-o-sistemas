# Domicilios tabulados

Clientes (Ventas y Mi perfil), proveedores y empleados utilizan el componente
`mockup_pastas/app/components/AddressFields.tsx` y el catálogo compartido
`mockup_pastas/app/data/domicilios.ts`.

Las tablas de provincias, localidades y calles tienen identificadores y relaciones:
una localidad pertenece a una provincia y una calle pertenece a una localidad.
El selector filtra las opciones y limpia las selecciones dependientes al cambiar
de provincia o localidad. Altura o kilómetro, piso y departamento se cargan aparte.

La calle se busca escribiendo las primeras letras. Las coincidencias se ordenan
alfabéticamente e ignoran mayúsculas y tildes. Se puede seleccionar con mouse,
toque o flechas y Enter; Escape cierra las sugerencias. Un texto parcial no se
acepta como calle al guardar.

Trenque Lauquen (Buenos Aires) incluye 133 calles, basadas en el
[plano municipal de julio de 2023](https://www.trenquelauquen.gov.ar/wordpress/wp-content/uploads/Mapa-Trenque-Lauquen-actualizado-Julio-2023.pdf).
Por ejemplo, `Vi` muestra Viani, Vignau y Villegas. La lista es ampliable y no
pretende incluir todas las calles ni los cambios posteriores al plano.

El catálogo es una muestra local para la maqueta, no un padrón nacional completo.
Para ampliar la cobertura, agregar una provincia a `PROVINCIAS`, sus localidades
a `LOCALIDADES` y sus calles a `callesPorLocalidad`. No hay una pantalla de
administración del catálogo ni conexión a un servicio geográfico.

Los datos de personas conservan los nombres seleccionados para ser compatibles
con los formatos existentes. El guardado valida la combinación contra las tablas.
Las direcciones anteriores de clientes que no están en el catálogo se muestran
como guardadas y pueden conservarse; al cambiar su ubicación se exige una
combinación del catálogo. Los proveedores iniciales separan calle y altura.
Los empleados anteriores muestran «Sin domicilio cargado» hasta completar su ficha;
sus cambios mantienen el almacenamiento de sesión que ya utilizaba la pantalla.

Pruebas desde `mockup_pastas`: `npm run test:domicilios`, `npm run typecheck`
y `npm run build`.
