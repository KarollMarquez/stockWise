import streamlit as st
import time
from unidecode import unidecode
from datetime import datetime
from clases import *
from init import generateData, productos, proveedores, ventas, compras

# Reporte 1: Producto con menor stock
def producto_menor_stock(self):
    if "productos" not in st.session_state:
        return "No hay productos"

    menor = st.session_state["productos"][0]
    for producto in st.session_state["productos"]:
        if producto.stock < menor.stock:
            menor = producto
    return menor

# Reporte 2: Proveedores más frecuentes
def proveedores_mas_frecuentes(self):
    conteo = {}
    for compra in self:
        id_proveedor = compra.idProveedor
        if id_proveedor in conteo:
            conteo[id_proveedor] += 1
        else:
            conteo[id_proveedor] = 1

    # Ordenar de mayor a menor
    lista_ordenada = []
    for proveedor in conteo:
        lista_ordenada.append((proveedor, conteo[proveedor]))

    for i in range(len(lista_ordenada)):
        for j in range(i + 1, len(lista_ordenada)):
            if lista_ordenada[i][1] < lista_ordenada[j][1]:
                lista_ordenada[i], lista_ordenada[j] = lista_ordenada[j], lista_ordenada[i]

    return lista_ordenada

# Reporte 3: Ventas por período de tiempo
def ventas_por_periodo(fecha_inicio, fecha_fin):
    resultado = []
    for venta in st.session_state["ventas"]:
        if fecha_inicio <= venta.fechaDeVenta and venta.fechaDeVenta <= fecha_fin:
            resultado.append(venta)
    return resultado

# Reporte 4: Productos más vendidos
def productos_mas_vendidos():
    conteo = {}
    for venta in st.session_state["ventas"]:
        id_producto = venta.idProducto
        if id_producto in conteo:
            conteo[id_producto] += 1
        else:
            conteo[id_producto] = 1

    # Ordenar de mayor a menor
    lista_ordenada = []
    for producto in conteo:
        lista_ordenada.append((producto, conteo[producto]))

    for i in range(len(lista_ordenada)):
        for j in range(i + 1, len(lista_ordenada)):
            if lista_ordenada[i][1] < lista_ordenada[j][1]:
                lista_ordenada[i], lista_ordenada[j] = lista_ordenada[j], lista_ordenada[i]

    return lista_ordenada

def validarTexto(input, mensaje):
    if input.strip() == "":
        st.error(f"❌ {mensaje} no puede estar vacío")
        return False
    return True

#Funcion añadir producto
def addProducto(recargar):
    st.write("Ingrese los datos del nuevo producto:")
    cols = st.columns(3)
    nombre = cols[0].text_input("Nombre")
    categorias = ["Belleza", "Tecnología", "Alimentos", "Ropa y Calzado", "Electrónica", "Hogar", "Deportes", "Juguetes"]
    categoria = cols[1].selectbox(
            "",
            options=["Categoria"] + [categoria for categoria in categorias]
        )
    precio = cols[2].text_input("Precio")

    cols = st.columns(2)
    stock = cols[0].text_input("Stock")
    desc = cols[1].text_input("Descripción")

    if st.button("Guardar"):
        id = buscarNextID(productos, "prod")
        if not validarTexto(nombre, "El nombre") or not validarTexto(desc, "La descripción"):
            return   # o como estés generando los IDs
        with open('productos.csv', 'a') as file:
            file.write(f"{id},{nombre},{categoria},{precio},{stock},{desc}\n")
        st.success("✅ Datos guardados")
        generateData('productos.csv', productos, Producto)
        recargar()  # recarga el array de productos en la interfaz
        st.session_state.modo = 'ver'
        time.sleep(1)
        st.rerun()

def validarContacto(input):
    if not input.isdigit() and not("@" in input):
        st.error(f"❌ Contacto debe ser un número o un email")
        return False
    return True

#Funcion añadir proveedor
def addProveedor(recargar):
    st.write("Ingrese los datos del nuevo proveedor:")
    cols = st.columns(3)
    nombre = cols[0].text_input("Nombre")
    contacto = cols[1].text_input("Contacto")
    direccion = cols[2].text_input("Dirección")

    if st.button("Guardar"):
        if not validarTexto(nombre, "El nombre") or not validarContacto(contacto):
            return
        id = buscarNextID(proveedores, "p")  # o como estés generando los IDs
        with open('proveedores.csv', 'a') as file:
            file.write(f"{id},{nombre},{contacto},{direccion}\n")
        st.success("✅ Datos guardados")
        generateData('proveedores.csv', proveedores, Proveedor)
        recargar()  # recarga el array de los proveedores en la interfaz
        st.session_state.modo = 'ver'
        time.sleep(1)
        st.rerun()

def actualizarStock(id, cantidad, recargar):
    with open('productos.csv', 'r') as file:
        lines = file.readlines()
    with open('productos.csv', 'w') as file:
        for line in lines:
            line_data = line.strip().split(',')
            if line_data[0] == id:
                line_data[4] = str(int(line_data[4]) + int(cantidad))
                file.write(",".join(line_data) + "\n")
            else:
                file.write(line)
    generateData('productos.csv', productos, Producto)
    recargar()

def validarStock(id, cantidad):
    for producto in productos:
        if producto.idProducto == id:
            if int(producto.stock) < cantidad:
                return int(producto.stock)
    return True

#Funcion añadir venta
def addVenta(recargar, recargarP):
    st.write("Ingrese los datos de la venta:")
    cols = st.columns(3)
    idProducto = cols[0].selectbox(
            "",
            options=["ID del Producto"] + [producto.idProducto for producto in productos]
        )
    idCliente = cols[1].text_input("ID del cliente: (ejemplo: cliente01)")
    cantidad = cols[2].text_input("Cantidad")
    fecha = datetime.now().strftime("%d-%m-%Y")

    if st.button("Guardar"):
        stock = validarStock(idProducto, int(cantidad))
        if type(stock) == int:
            st.error(f"❌ No hay suficiente stock, solo hay: {stock}")
            return
        id = buscarNextID(ventas, "v")  # o como estés generando los IDs
        with open('ventas.csv', 'a') as file:
            file.write(f"{id},{idProducto},{idCliente},{fecha},{cantidad}\n")
        actualizarStock(idProducto, -int(cantidad), recargarP)
        st.success("✅ Datos guardados")
        generateData('ventas.csv', ventas, Venta)
        recargar()  # recarga el array de las ventas en la interfaz
        st.session_state.modo = 'ver'
        time.sleep(1)
        st.rerun()
#Función añadir compra
def addCompra(recargar, recargarP):
    st.write("Ingrese los datos de la compra:")
    cols = st.columns(3)
    idProducto = cols[0].selectbox(
            "",
            options=["ID del Producto"] + [producto.idProducto for producto in productos]
        )
    idProveedor = cols[1].selectbox(
            "",
            options=["ID del Proveedor"] + [proveedor.idProveedor for proveedor in proveedores]
        )
    cantidad = cols[2].text_input("Cantidad")
    fecha = datetime.now().strftime("%d-%m-%Y")

    if st.button("Guardar"):
        id = buscarNextID(compras, "c")  # o como estés generando los IDs
        with open('compras.csv', 'a') as file:
            file.write(f"{id},{idProducto},{idProveedor},{fecha},{cantidad}\n")
        actualizarStock(idProducto, cantidad, recargarP)
        st.success("✅ Datos guardados")
        generateData('compras.csv', compras, Compra)
        recargar()  # recarga el array de las ventas en la interfaz
        st.session_state.modo = 'ver'
        time.sleep(1)
        st.rerun()

def buscarNextID(lista, prefijo):
    if not lista:  # Verifica si la lista está vacía
        return f"{prefijo}001"

    last = lista[-1]
    lastID = list(vars(last).values())[0] # Obtiene el atributo
    lastID = int(lastID.replace(prefijo, ""))  # Elimina el prefijo y convierte a entero
    nextID = f"{prefijo}{str(lastID + 1).zfill(3)}"  # Formatea con ceros a la izquierda
    return nextID

def mostrarDatos(lista, columnas, atributos, clave_prefijo, actualizar_fn, eliminar_fn):
    # Verificar si se está en modo edición o eliminación
    if st.session_state.get("modo") == "editar":
        actualizar_fn(st.session_state.get("id_editando"))
        return
    elif st.session_state.get("modo") == "eliminar":
        eliminar_fn(st.session_state.get("id_eliminando"))
        return

    # Crear columnas y mostrar encabezados
    cols = st.columns(len(columnas))
    for col, val in zip(cols, columnas):
        col.write(f"**{val}**")

    # Mostrar filas con datos
    for item in lista:
        cols = st.columns(len(columnas))  # Nueva fila con las mismas columnas
        
        # Extraer datos dinámicamente
        datos = [getattr(item, attr) for attr in atributos]
        for col, val in zip(cols[:-1], datos):  # Excluye la última columna (Opciones)
            col.write(val)
        
        # Desplegable de opciones en la última columna
        with cols[-1]:
            opcion = st.selectbox(
                "", 
                ["Elija", "Actualizar", "Eliminar"], 
                key=f"opt_{getattr(item, atributos[0])}"  # Usa el ID como clave
            )
        
            # Ejecutar acción según la selección
            if opcion == "Actualizar":
                st.session_state.modo = 'editar'
                st.session_state.id_editando = datos[0]
                st.rerun()
            elif opcion == "Eliminar":
                st.session_state.modo = 'eliminar'
                st.session_state.id_eliminando = datos[0]
                st.rerun()


def filtrarProductos(xproductos):
    opcion = st.selectbox("🔎 Buscar productos por:", [
            "📄 Nombre",
            "📑 Categoría",
        ])
    
    if opcion == "📄 Nombre":
        cols = st.columns(1)
        nombre = cols[0].selectbox(
            "",
            options=["Nombre a buscar"] + [producto.nombre for producto in productos]
        )
        for producto in xproductos:
            if unidecode(producto.nombre.casefold()) == unidecode(nombre.casefold()):
                with st.container(): #Agrupa las columnas dentro de un contenedor
                    cols = st.columns(6)
                    #Toma los atributos de cada producto y los guarda en valores
                    valores = [
                        producto.idProducto, producto.nombre, producto.categoria, producto.precio,                     
                        producto.stock,producto.descripcion]
                    #Escribe cada atributo del producto en su respectiva columna
                    for col, val in zip(cols, valores):
                        with col:
                            st.write(val)

    elif opcion == "📑 Categoría":
        cols = st.columns(1)
        categorias = ["Belleza", "Tecnología", "Alimentos", "Ropa y Calzado", "Electrónica", "Hogar", "Deportes", "Juguetes"]
        cat = cols[0].selectbox(
            "",
            options=["Categoria a buscar"] + [categoria for categoria in categorias]
        )
        for producto in xproductos:
            if unidecode(producto.categoria.casefold()) == unidecode(cat.casefold()):
                with st.container(): #Agrupa las columnas dentro de un contenedor
                    cols = st.columns(6)
                    #Toma los atributos de cada producto y los guarda en valores
                    valores = [
                        producto.idProducto, producto.nombre, producto.categoria, producto.precio,                     
                        producto.stock,producto.descripcion]
                    #Escribe cada atributo del producto en su respectiva columna
                    for col, val in zip(cols, valores):
                        with col:
                            st.write(val)

def actualizarP(id, recargar):
    st.subheader("Ingrese los nuevos datos del producto:")
    st.write("Si el dato no necesita ser cambiado, dejeló vacío.")
    cols = st.columns(5)
    Nombre = cols[0].text_input("Nombre")
    categorias = ["Belleza", "Tecnología", "Alimentos", "Ropa y Calzado", "Electrónica", "Hogar", "Deportes", "Juguetes"]
    Categoria = cols[1].selectbox(
            "",
            options=["Categoria"] + [categoria for categoria in categorias]
        )
    Precio = cols[2].text_input("Precio")
    Stock = cols[3].text_input("Stock")
    Descripcion = cols[4].text_input("Descripción")

    if st.button("Guardar"):
        with open('productos.csv', 'r') as file:
            lines = file.readlines()

        with open('productos.csv', 'w') as file:
            for line in lines:
                line_data = line.strip().split(',')
                if line_data[0] == id:  #Si el ID coincide, verifica que la línea no esté vacía y la actualiza
                    if Nombre.strip(): line_data[1] = Nombre
                    if Categoria.strip(): line_data[2] = Categoria
                    if Precio.strip(): line_data[3] = Precio
                    if Stock.strip(): line_data[4] = Stock
                    if Descripcion.strip(): line_data[5] = Descripcion
                    file.write(",".join(line_data) + "\n")
                else:
                    file.write(line)
        st.success("✅ Datos actualizados")
        generateData('productos.csv', productos, Producto)
        recargar()  # recarga el array de productos en la interfaz
        st.session_state.modo = 'ver'
        time.sleep(1)
        st.rerun()

def actualizarPv(id, recargar):
    st.subheader("Ingrese los nuevos datos del proveedor:")
    st.write("Si el dato no necesita ser cambiado, dejeló vacío.")
    cols = st.columns(3)
    Nombre = cols[0].text_input("Nombre")
    Contacto = cols[1].text_input("Contacto")
    Direccion = cols[2].text_input("Dirección")

    if st.button("Guardar"):
        with open('proveedores.csv', 'r') as file:
            lines = file.readlines()

        with open('proveedores.csv', 'w') as file:
            for line in lines:
                line_data = line.strip().split(',')
                if line_data[0] == id:  #Si el ID coincide, verifica que la línea no esté vacía y la actualiza
                    if Nombre.strip(): line_data[1] = Nombre
                    if Contacto.strip(): line_data[2] = Contacto
                    if Direccion.strip(): line_data[3] = Direccion
                    file.write(",".join(line_data) + "\n")
                else:
                    file.write(line)
        st.success("✅ Datos actualizados")
        generateData('proveedores.csv', proveedores, Proveedor)
        recargar()  # recarga el array de productos en la interfaz
        st.session_state.modo = 'ver'
        time.sleep(1)
        st.rerun()

def actualizarC(id, recargar):
    st.subheader("Ingrese los nuevos datos de la compra:")
    st.write("Si el dato no necesita ser cambiado, dejeló vacío.")
    cols = st.columns(3)
    idProducto = cols[0].selectbox(
            "",
            options=["ID del Producto"] + [producto.idProducto for producto in productos]
        )
    idProveedor = cols[1].selectbox(
            "",
            options=["ID del Proveedor"] + [proveedor.idProveedor for proveedor in proveedores]
        )
    cantidad = cols[2].text_input("Cantidad")
    if st.button("Guardar"):
        with open('compras.csv', 'r') as file:
            lines = file.readlines()

        with open('compras.csv', 'w') as file:
            for line in lines:
                line_data = line.strip().split(',')
                if line_data[0] == id:  #Si el ID coincide, verifica que la línea no esté vacía y la actualiza
                    if idProducto.strip(): line_data[1] = idProducto
                    if idProveedor.strip(): line_data[2] = idProveedor
                    if cantidad.strip(): line_data[4] = cantidad
                    file.write(",".join(line_data) + "\n")
                else:
                    file.write(line)
        
        st.success("✅ Datos actualizados")
        generateData('compras.csv', compras, Compra)
        recargar()  # Recarga el array de compras en la interfaz
        st.session_state.modo = 'ver'
        time.sleep(1)
        st.rerun()

def actualizarV(id, recargar):
    #ID de Venta, ID del Producto, ID del Cliente, Fecha de Venta, Cantidad
    st.subheader("Ingrese los nuevos datos de la venta:")
    st.write("Si el dato no necesita ser cambiado, dejeló vacío.")
    cols = st.columns(3)
    idProducto = cols[0].selectbox(
            "",
            options=["ID del Producto"] + [producto.idProducto for producto in productos]
        )
    idCliente = cols[1].text_input("ID del cliente (ejemplo: cliente01)")
    cantidad = cols[2].text_input("Cantidad")

    if st.button("Guardar"):
        with open('ventas.csv', 'r') as file:
            lines = file.readlines()

        with open('ventas.csv', 'w') as file:
            for line in lines:
                line_data = line.strip().split(',')
                if line_data[0] == id:  #Si el ID coincide, verifica que la línea no esté vacía y la actualiza
                    if idProducto.strip(): line_data[1] = idProducto
                    if idCliente.strip(): line_data[2] = idCliente
                    if cantidad.strip(): line_data[4] = cantidad
                    file.write(",".join(line_data) + "\n")
                else:
                    file.write(line)
        
        st.success("✅ Datos actualizados")
        generateData('ventas.csv', ventas, Venta)
        recargar()  # Recarga el array de compras en la interfaz
        st.session_state.modo = 'ver'
        time.sleep(1)
        st.rerun()

def eliminarP(id, recargar):
    st.write(f"¿Seguro que deseas eliminar el producto con ID {id}?")
    if st.button("Eliminar"):        
            with open('productos.csv', 'r') as file:
                lines = file.readlines()
            
            encabezado = lines[0]
            productos_filtrados = []

            for line in lines [1:]:
                line_data = line.strip().split(',')
                if line_data[0] != id:
                    productos_filtrados.append(line_data)
            
            contador_id = 1
            for producto in productos_filtrados:
                nuevo_id = "prod" + str(contador_id).zfill(3)  # Formato prod001, prod002...
                producto[0] = nuevo_id
                contador_id += 1
            
            with open('productos.csv', 'w') as file:
                file.write(encabezado)
                for producto in productos_filtrados:
                    file.write(",".join(producto) + "\n")
            
            st.success("✅ Producto eliminado e IDs actualizados")
            generateData('productos.csv', productos, Producto)
            recargar()  # Recarga los productos en la interfaz
            st.session_state.modo = 'ver'
            time.sleep(1)
            st.rerun()
    elif st.button("No"):
        st.session_state.modo = 'ver'
        st.rerun()

def eliminarPv(id, recargar):
    st.write(f"¿Seguro que deseas eliminar el proveedor con ID {id}?")
    if st.button("Eliminar"):        
        with open('proveedores.csv', 'r') as file:
            lines = file.readlines()
        
        encabezado = lines[0]
        proveedoresFiltrados = []

        for line in lines [1:]:
            line_data = line.strip().split(',')
            if line_data[0] != id:
                proveedoresFiltrados.append(line_data)
        
        contador_id = 1
        for proveedor in proveedoresFiltrados:
            nuevo_id = "p" + str(contador_id).zfill(3)
            proveedor[0] = nuevo_id
            contador_id += 1
        
        with open('proveedores.csv', 'w') as file:
            file.write(encabezado)
            for proveedor in proveedoresFiltrados:
                file.write(",".join(proveedor) + "\n")
        
        st.success("✅ Proveedor eliminado e IDs actualizados")
        generateData('proveedores.csv', proveedores, Proveedor)
        recargar()  # Recarga los proveedores en la interfaz
        st.session_state.modo = 'ver'
        time.sleep(1)
        st.rerun()
    elif st.button("No"):
        st.session_state.modo = 'ver'
        st.rerun()

def eliminarC(id, recargar):
    st.write(f"¿Seguro que deseas eliminar la compra con ID {id}?")
    if st.button("Eliminar"):        
        with open('compras.csv', 'r') as file:
            lines = file.readlines()
        
        encabezado = lines[0]
        compras_filtradas = []

        for line in lines[1:]:
            line_data = line.strip().split(',')
            if line_data[0] != id:
                compras_filtradas.append(line_data)
        
        contador_id = 1
        for compra in compras_filtradas:
            nuevo_id = "c" + str(contador_id).zfill(3)
            compra[0] = nuevo_id
            contador_id += 1
        
        with open('compras.csv', 'w') as file:
            file.write(encabezado)
            for compra in compras_filtradas:
                file.write(",".join(compra) + "\n")
        
        st.success("✅ Compra eliminada e IDs actualizados")
        generateData('compras.csv', compras, Compra)
        recargar()  # Recarga las compras en la interfaz
        st.session_state.modo = 'ver'
        time.sleep(1)
        st.rerun()
    elif st.button("No"):
        st.session_state.modo = 'ver'
        st.rerun()

def eliminarV(id, recargar):
    st.write(f"¿Seguro que deseas eliminar la venta con ID {id}?")
    if st.button("Eliminar"):        
        with open('ventas.csv', 'r') as file:
            lines = file.readlines()
        
        encabezado = lines[0]
        ventasFiltradas = []

        for line in lines[1:]:
            line_data = line.strip().split(',')
            if line_data[0] != id:
                ventasFiltradas.append(line_data)
        
        contador_id = 1

        for venta in ventasFiltradas:
            nuevo_id = "c" + str(contador_id).zfill(3)
            venta[0] = nuevo_id
            contador_id += 1
        
        with open('ventas.csv', 'w') as file:
            file.write(encabezado)
            for venta in ventasFiltradas:
                file.write(",".join(venta) + "\n")
        
        st.success("✅ Venta eliminada e IDs actualizados")
        generateData('ventas.csv', ventas, Venta)
        recargar()  # Recarga las compras en la interfaz
        st.session_state.modo = 'ver'
        time.sleep(1)
        st.rerun()
    elif st.button("No"):
        st.session_state.modo = 'ver'
        st.rerun()
