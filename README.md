# Diseño-Sistemas
Traverso, Ascani, Ortellado
Cambios del proyecto anual


## Cambios a hacer en la documentación
1.  __Nuevas clases__ --> Van a tener que agregaese a la documentacion.
   * Persona(Se modificaron atributos en Cliente, Empleado, Proveedor)
   * Telefono(Se modifico atributo en Direccion y lo convertimos en una clase en sí)
   * DetalleOrdenMaquina (Se agrego con el fin de asociar el ordenproduccion con la maquina utilizada) 
3.  __Cambios en atributos dentro de clases__ --> Es importante guardar los cambios de atributos para despues saber que modificar en la documentacion
   * OrdenPedidoCliente y OrdenCompraProveedor: Se agrego "IdEmpleado" 
   * OrdenProduccion: Se agrego "Estado" y "NmrLote"
   * Producto: Se agrego "FechaVencimiento"
3.  __Cambios en las relaciones__
   * Se modifico la relacion Direccion -> Provincia a Direccion -> Calle
   * Ahora OrdenPedidoCliente y OrdenCompraProveedor estan relacionadas con Empleado
   * Se elimino la relacion entre "Producto" y "ComprobanteVentaCliente" (Se relaciona con el detalle, queda circular sino).
     
## Cosas a hacer cada uno
1.  __Tomas__
Terminar con la eliminacion de clases y hacer el armado final de clases (Tienen que quedar las mismas que en el diagrama de clases).
2.  __Gero__
Hacer los cambios en la documentacion a medida que vayamos agregando/eliminando atributos. Hacer la documentacion de las dos nuevas Clases.
3.  __Carlos__
Modificar los atributos para que tengan sentido y poder llevarlo a las pantallas.
