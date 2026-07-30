import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Core imports
from clases import Producto, Proveedor, Venta, Compra
from init import generateData, productos, proveedores, ventas, compras

app = FastAPI(title="StockWise API", version="1.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared schemas
class ProductSchema(BaseModel):
    idProducto: Optional[str] = None
    nombre: str
    categoria: str
    precio: float
    stock: int
    descripcion: str

class ProviderSchema(BaseModel):
    idProveedor: Optional[str] = None
    nombre: str
    contacto: str
    direccion: str

class SaleSchema(BaseModel):
    idVenta: Optional[str] = None
    idProducto: str
    idCliente: str
    fechaDeVenta: Optional[str] = None
    cantidad: int

class PurchaseSchema(BaseModel):
    idCompra: Optional[str] = None
    idProducto: str
    idProveedor: str
    fechaDeCompra: Optional[str] = None
    cantidad: int

# Helper to generate IDs
def get_next_id(lista, prefijo):
    if not lista:
        return f"{prefijo}001"
    last = lista[-1]
    last_id_str = list(vars(last).values())[0]
    last_id_num = int(last_id_str.replace(prefijo, ""))
    next_id = f"{prefijo}{str(last_id_num + 1).zfill(3)}"
    return next_id

# Helper to update stock
def update_stock_in_file(id_prod: str, amount: int):
    with open('productos.csv', 'r', encoding='utf-8') as file:
        lines = file.readlines()
    with open('productos.csv', 'w', encoding='utf-8') as file:
        for line in lines:
            line_data = line.strip().split(',')
            if line_data[0] == id_prod:
                line_data[4] = str(int(line_data[4]) + amount)
                file.write(",".join(line_data) + "\n")
            else:
                file.write(line)
    generateData('productos.csv', productos, Producto)

# Health endpoint
@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "StockWise API"}

# Product Endpoints
@app.get("/api/products")
def get_products():
    generateData('productos.csv', productos, Producto)
    return [
        {
            "idProducto": p.idProducto,
            "nombre": p.nombre,
            "categoria": p.categoria,
            "precio": float(p.precio),
            "stock": int(p.stock),
            "descripcion": p.descripcion,
        }
        for p in productos
    ]

@app.post("/api/products")
def create_product(prod: ProductSchema):
    generateData('productos.csv', productos, Producto)
    next_id = get_next_id(productos, "prod")

    # Validation matching original
    if not prod.nombre.strip():
        raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
    if not prod.descripcion.strip():
        raise HTTPException(status_code=400, detail="La descripción no puede estar vacía")

    with open('productos.csv', 'a', encoding='utf-8') as file:
        file.write(f"{next_id},{prod.nombre},{prod.categoria},{prod.precio},{prod.stock},{prod.descripcion}\n")

    generateData('productos.csv', productos, Producto)
    return {"message": "Producto creado", "idProducto": next_id}

@app.put("/api/products/{id_prod}")
def update_product(id_prod: str, prod: ProductSchema):
    generateData('productos.csv', productos, Producto)

    found = False
    with open('productos.csv', 'r', encoding='utf-8') as file:
        lines = file.readlines()

    with open('productos.csv', 'w', encoding='utf-8') as file:
        for line in lines:
            line_data = line.strip().split(',')
            if line_data[0] == id_prod:
                found = True
                if prod.nombre.strip(): line_data[1] = prod.nombre
                if prod.categoria.strip(): line_data[2] = prod.categoria
                line_data[3] = str(prod.precio)
                line_data[4] = str(prod.stock)
                if prod.descripcion.strip(): line_data[5] = prod.descripcion
                file.write(",".join(line_data) + "\n")
            else:
                file.write(line)

    if not found:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    generateData('productos.csv', productos, Producto)
    return {"message": "Producto actualizado"}

@app.delete("/api/products/{id_prod}")
def delete_product(id_prod: str):
    generateData('productos.csv', productos, Producto)

    with open('productos.csv', 'r', encoding='utf-8') as file:
        lines = file.readlines()

    encabezado = lines[0]
    productos_filtrados = []
    found = False

    for line in lines[1:]:
        line_data = line.strip().split(',')
        if line_data[0] != id_prod:
            productos_filtrados.append(line_data)
        else:
            found = True

    if not found:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Recalculate IDs
    contador_id = 1
    for p in productos_filtrados:
        p[0] = "prod" + str(contador_id).zfill(3)
        contador_id += 1

    with open('productos.csv', 'w', encoding='utf-8') as file:
        file.write(encabezado)
        for p in productos_filtrados:
            file.write(",".join(p) + "\n")

    generateData('productos.csv', productos, Producto)
    return {"message": "Producto eliminado e IDs actualizados"}

# Provider Endpoints
@app.get("/api/providers")
def get_providers():
    generateData('proveedores.csv', proveedores, Proveedor)
    return [
        {
            "idProveedor": p.idProveedor,
            "nombre": p.nombre,
            "contacto": p.contacto,
            "direccion": p.direccion,
        }
        for p in proveedores
    ]

@app.post("/api/providers")
def create_provider(prov: ProviderSchema):
    generateData('proveedores.csv', proveedores, Proveedor)
    next_id = get_next_id(proveedores, "p")

    if not prov.nombre.strip():
        raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
    # Validate contact (must be numeric or contain @)
    if not prov.contacto.isdigit() and "@" not in prov.contacto:
        raise HTTPException(status_code=400, detail="Contacto debe ser un número o un email")

    with open('proveedores.csv', 'a', encoding='utf-8') as file:
        file.write(f"{next_id},{prov.nombre},{prov.contacto},{prov.direccion}\n")

    generateData('proveedores.csv', proveedores, Proveedor)
    return {"message": "Proveedor creado", "idProveedor": next_id}

@app.put("/api/providers/{id_prov}")
def update_provider(id_prov: str, prov: ProviderSchema):
    generateData('proveedores.csv', proveedores, Proveedor)

    found = False
    with open('proveedores.csv', 'r', encoding='utf-8') as file:
        lines = file.readlines()

    with open('proveedores.csv', 'w', encoding='utf-8') as file:
        for line in lines:
            line_data = line.strip().split(',')
            if line_data[0] == id_prov:
                found = True
                if prov.nombre.strip(): line_data[1] = prov.nombre
                if prov.contacto.strip(): line_data[2] = prov.contacto
                if prov.direccion.strip(): line_data[3] = prov.direccion
                file.write(",".join(line_data) + "\n")
            else:
                file.write(line)

    if not found:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    generateData('proveedores.csv', proveedores, Proveedor)
    return {"message": "Proveedor actualizado"}

@app.delete("/api/providers/{id_prov}")
def delete_provider(id_prov: str):
    generateData('proveedores.csv', proveedores, Proveedor)

    with open('proveedores.csv', 'r', encoding='utf-8') as file:
        lines = file.readlines()

    encabezado = lines[0]
    proveedores_filtrados = []
    found = False

    for line in lines[1:]:
        line_data = line.strip().split(',')
        if line_data[0] != id_prov:
            proveedores_filtrados.append(line_data)
        else:
            found = True

    if not found:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    contador_id = 1
    for p in proveedores_filtrados:
        p[0] = "p" + str(contador_id).zfill(3)
        contador_id += 1

    with open('proveedores.csv', 'w', encoding='utf-8') as file:
        file.write(encabezado)
        for p in proveedores_filtrados:
            file.write(",".join(p) + "\n")

    generateData('proveedores.csv', proveedores, Proveedor)
    return {"message": "Proveedor eliminado e IDs actualizados"}

# Sales Endpoints
@app.get("/api/sales")
def get_sales():
    generateData('ventas.csv', ventas, Venta)
    return [
        {
            "idVenta": v.idVenta,
            "idProducto": v.idProducto,
            "idCliente": v.idCliente,
            "fechaDeVenta": v.fechaDeVenta,
            "cantidad": int(v.cantidad),
        }
        for v in ventas
    ]

@app.post("/api/sales")
def create_sale(sale: SaleSchema):
    generateData('productos.csv', productos, Producto)
    generateData('ventas.csv', ventas, Venta)

    # Find product and check stock
    target_product = None
    for p in productos:
        if p.idProducto == sale.idProducto:
            target_product = p
            break

    if not target_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if int(target_product.stock) < sale.cantidad:
        raise HTTPException(status_code=400, detail=f"No hay suficiente stock, solo hay: {target_product.stock}")

    next_id = get_next_id(ventas, "v")
    fecha = sale.fechaDeVenta or datetime.now().strftime("%d-%m-%Y")

    with open('ventas.csv', 'a', encoding='utf-8') as file:
        file.write(f"{next_id},{sale.idProducto},{sale.idCliente},{fecha},{sale.cantidad}\n")

    # Deduct stock
    update_stock_in_file(sale.idProducto, -sale.cantidad)
    generateData('ventas.csv', ventas, Venta)
    return {"message": "Venta guardada exitosamente", "idVenta": next_id}

@app.put("/api/sales/{id_venta}")
def update_sale(id_venta: str, sale: SaleSchema):
    generateData('ventas.csv', ventas, Venta)

    found = False
    with open('ventas.csv', 'r', encoding='utf-8') as file:
        lines = file.readlines()

    with open('ventas.csv', 'w', encoding='utf-8') as file:
        for line in lines:
            line_data = line.strip().split(',')
            if line_data[0] == id_venta:
                found = True
                if sale.idProducto.strip(): line_data[1] = sale.idProducto
                if sale.idCliente.strip(): line_data[2] = sale.idCliente
                line_data[4] = str(sale.cantidad)
                file.write(",".join(line_data) + "\n")
            else:
                file.write(line)

    if not found:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    generateData('ventas.csv', ventas, Venta)
    return {"message": "Venta actualizada"}

@app.delete("/api/sales/{id_venta}")
def delete_sale(id_venta: str):
    generateData('ventas.csv', ventas, Venta)

    with open('ventas.csv', 'r', encoding='utf-8') as file:
        lines = file.readlines()

    encabezado = lines[0]
    ventas_filtradas = []
    found = False

    for line in lines[1:]:
        line_data = line.strip().split(',')
        if line_data[0] != id_venta:
            ventas_filtradas.append(line_data)
        else:
            found = True

    if not found:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    contador_id = 1
    for v in ventas_filtradas:
        v[0] = "v" + str(contador_id).zfill(3)
        contador_id += 1

    with open('ventas.csv', 'w', encoding='utf-8') as file:
        file.write(encabezado)
        for v in ventas_filtradas:
            file.write(",".join(v) + "\n")

    generateData('ventas.csv', ventas, Venta)
    return {"message": "Venta eliminada e IDs actualizados"}

# Purchases Endpoints
@app.get("/api/purchases")
def get_purchases():
    generateData('compras.csv', compras, Compra)
    return [
        {
            "idCompra": c.idCompra,
            "idProducto": c.idProducto,
            "idProveedor": c.idProveedor,
            "fechaDeCompra": c.fechaDeCompra,
            "cantidad": int(c.cantidad),
        }
        for c in compras
    ]

@app.post("/api/purchases")
def create_purchase(pur: PurchaseSchema):
    generateData('productos.csv', productos, Producto)
    generateData('compras.csv', compras, Compra)

    next_id = get_next_id(compras, "c")
    fecha = pur.fechaDeCompra or datetime.now().strftime("%d-%m-%Y")

    with open('compras.csv', 'a', encoding='utf-8') as file:
        file.write(f"{next_id},{pur.idProducto},{pur.idProveedor},{fecha},{pur.cantidad}\n")

    # Add stock
    update_stock_in_file(pur.idProducto, pur.cantidad)
    generateData('compras.csv', compras, Compra)
    return {"message": "Compra guardada exitosamente", "idCompra": next_id}

@app.put("/api/purchases/{id_compra}")
def update_purchase(id_compra: str, pur: PurchaseSchema):
    generateData('compras.csv', compras, Compra)

    found = False
    with open('compras.csv', 'r', encoding='utf-8') as file:
        lines = file.readlines()

    with open('compras.csv', 'w', encoding='utf-8') as file:
        for line in lines:
            line_data = line.strip().split(',')
            if line_data[0] == id_compra:
                found = True
                if pur.idProducto.strip(): line_data[1] = pur.idProducto
                if pur.idProveedor.strip(): line_data[2] = pur.idProveedor
                line_data[4] = str(pur.cantidad)
                file.write(",".join(line_data) + "\n")
            else:
                file.write(line)

    if not found:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    generateData('compras.csv', compras, Compra)
    return {"message": "Compra actualizada"}

@app.delete("/api/purchases/{id_compra}")
def delete_purchase(id_compra: str):
    generateData('compras.csv', compras, Compra)

    with open('compras.csv', 'r', encoding='utf-8') as file:
        lines = file.readlines()

    encabezado = lines[0]
    compras_filtradas = []
    found = False

    for line in lines[1:]:
        line_data = line.strip().split(',')
        if line_data[0] != id_compra:
            compras_filtradas.append(line_data)
        else:
            found = True

    if not found:
        raise HTTPException(status_code=404, detail="Compra no encontrada")

    contador_id = 1
    for c in compras_filtradas:
        c[0] = "c" + str(contador_id).zfill(3)
        contador_id += 1

    with open('compras.csv', 'w', encoding='utf-8') as file:
        file.write(encabezado)
        for c in compras_filtradas:
            file.write(",".join(c) + "\n")

    generateData('compras.csv', compras, Compra)
    return {"message": "Compra eliminada e IDs actualizados"}

# Reports Endpoints
@app.get("/api/reports/low-stock")
def report_low_stock():
    generateData('productos.csv', productos, Producto)
    low_stock = []
    for p in productos:
        if int(p.stock) <= 20:
            low_stock.append({
                "idProducto": p.idProducto,
                "nombre": p.nombre,
                "categoria": p.categoria,
                "precio": float(p.precio),
                "stock": int(p.stock),
                "descripcion": p.descripcion,
            })
    # Sort by stock ascending
    low_stock.sort(key=lambda x: x["stock"])
    return low_stock

@app.get("/api/reports/frequent-providers")
def report_frequent_providers():
    generateData('compras.csv', compras, Compra)

    compras_por_proveedor = {}
    unidades_por_proveedor = {}

    for c in compras:
        prov = c.idProveedor
        cant = int(c.cantidad)
        compras_por_proveedor[prov] = compras_por_proveedor.get(prov, 0) + 1
        unidades_por_proveedor[prov] = unidades_por_proveedor.get(prov, 0) + cant

    lista = []
    for prov in compras_por_proveedor:
        lista.append({
            "idProveedor": prov,
            "compras": compras_por_proveedor[prov],
            "unidades": unidades_por_proveedor[prov]
        })

    # Sort descending by compras, then by units
    lista.sort(key=lambda x: (-x["compras"], -x["unidades"]))
    return lista[:3]

@app.get("/api/reports/sales-by-period")
def report_sales_by_period(start_date: str, end_date: str):
    generateData('ventas.csv', ventas, Venta)

    # Standard format parser
    def parse_date(d_str):
        for fmt in ("%Y-%m-%d", "%d-%m-%Y"):
            try:
                return datetime.strptime(d_str, fmt)
            except ValueError:
                continue
        return None

    s_dt = parse_date(start_date)
    e_dt = parse_date(end_date)

    if not s_dt or not e_dt:
        raise HTTPException(status_code=400, detail="Formatos de fecha inválidos")

    filtradas = []
    for v in ventas:
        v_dt = parse_date(v.fechaDeVenta)
        if v_dt and s_dt <= v_dt <= e_dt:
            filtradas.append({
                "idVenta": v.idVenta,
                "idProducto": v.idProducto,
                "idCliente": v.idCliente,
                "fechaDeVenta": v.fechaDeVenta,
                "cantidad": int(v.cantidad)
            })
    return filtradas

@app.get("/api/reports/best-sellers")
def report_best_sellers():
    generateData('ventas.csv', ventas, Venta)

    conteo_ventas = {}
    for v in ventas:
        prod_id = v.idProducto
        cant = int(v.cantidad)
        conteo_ventas[prod_id] = conteo_ventas.get(prod_id, 0) + cant

    best_sellers = []
    for prod_id, cant in conteo_ventas.items():
        if cant >= 4:
            best_sellers.append({
                "idProducto": prod_id,
                "unidades_vendidas": cant
            })

    best_sellers.sort(key=lambda x: -x["unidades_vendidas"])
    return best_sellers

# Serve SPA Frontend Built Files
frontend_dist_path = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.exists(frontend_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    @app.get("/{catchall:path}")
    def serve_frontend(catchall: str):
        # Allow checking health endpoint on Port 8000
        if catchall == "api/health":
            return {"status": "ok", "app": "StockWise API"}
        # Serve React production single page entrypoint
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
