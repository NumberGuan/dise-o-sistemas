# Diseño-Sistemas
Traverso, Ascani, Ortellado
Cambios del proyecto anual


## Cambios a hacer en la documentación
1.  __Nuevas clases__ --> Van a tener que agregaese a la documentacion.
   * Persona(Se modificaron atributos en Cliente, Empleado, Proveedor)
   * Telefono(Se modifico atributo en Direccion y lo convertimos en una clase en sí)
   * DetalleOrdenMaquina (Se agrego con el fin de asociar el ordenproduccion con la maquina utilizada) 
2.  __Cambios en atributos dentro de clases__ --> Es importante guardar los cambios de atributos para despues saber que modificar en la documentacion.
   * OrdenPedidoCliente y OrdenCompraProveedor: Se agrego "IdEmpleado" .
   * OrdenProduccion: Se agrego "Estado" y "NmrLote". Se elimino "IdReceta".
   * DetalleOrdenProduccion: Se agrego "IdReceta". Cambiamos "CantidadProducto" por "CantidadRealGenerada" y "CantidadMateriaPrima" por "CantidadRealUtilizada".
   * Producto: Se agrego "FechaVencimiento".
   * Persona: "Nombre", "RazonSocial" y "Apellido" -> Ya no estan en cliente, proveedor ni empleado.
   * DetalleProducto: Cambiamos "CantidadGenerada" por "CantidadEsperada". (Una receta especifica cuanto producto vas a generar sin embargo puede pasar que salga mas o menos. Ese valor real esta en la clase "DetalleOrdenProduccion") --> Charlable tengo mis dudas de como para generar la orden debas saber de antemano cuanto vas a  obtener.
3.  __Cambios en las relaciones__
   * Se modifico la relacion Direccion -> Provincia a Direccion -> Calle. (Quedo segun lo que dijo David).
   * Ahora OrdenPedidoCliente y OrdenCompraProveedor estan relacionadas con Empleado.
   * Se elimino la relacion entre "Producto" y "ComprobanteVentaCliente" (Se relaciona unicamente con el detalle, queda circular sino).
   * Nueva relacion entre "Maquina", "DetalleOrdenMaquina" , "DetalleOrdenProduccion".
   * La "Receta" ahora se relaciona con "DetalleOrdenProduccion", de esta manera en una misma orden se pueden fabricar varios productos. (Antes: "Receta" --> "OrdenProduccion")
     
## Cosas a hacer cada uno
1.  __Tomas__
Terminar con la eliminacion de clases y hacer el armado final de clases (Tienen que quedar las mismas que en el diagrama de clases).
2.  __Gero__
Hacer los cambios en la documentacion a medida que vayamos agregando/eliminando atributos. Hacer la documentacion de las nuevas Clases.
3.  __Carlos__
Modificar los atributos para que tengan sentido y poder llevarlo a las pantallas.
