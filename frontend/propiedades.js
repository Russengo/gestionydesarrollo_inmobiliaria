
(() => {
    const app = () => window.Siandra;
    const db = () => app().db;
    const h = texto => app().escapar(texto);

    const BUCKET_IMAGENES = 'property-images';
    const MAX_TAMANO = 5 * 1024 * 1024;
    const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

    const tipos = ['Casa', 'Departamento', 'Terreno', 'Local', 'Galpón'];
    const operaciones = ['Venta', 'Alquiler', 'Ambas'];
    const estados = ['Disponible', 'Reservada', 'Alquilada', 'Vendida', 'Pausada'];

    let propiedades = [];
    let vistaActual = 'activas';

    async function render() {
        vistaActual = 'activas';

        const contenedor = app().contenido;
        contenedor.innerHTML = '<p>Cargando propiedades...</p>';

        const { data, error } = await db()
            .from('properties')
            .select('*')
            .is('archived_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            contenedor.innerHTML = `
                <div class="alert alert-danger">
                    No se pudieron cargar las propiedades: ${h(error.message)}
                </div>`;
            return;
        }

        propiedades = data || [];
        mostrarListado();
    }

    async function mostrarArchivadas() {
        if (!app().esAdmin()) {
            app().mensaje('Solo un administrador puede acceder a las propiedades archivadas.', 'danger');
            return;
        }

        vistaActual = 'archivadas';

        app().contenido.innerHTML = '<p>Cargando propiedades archivadas...</p>';

        const { data, error } = await db()
            .from('properties')
            .select('*')
            .not('archived_at', 'is', null)
            .order('archived_at', { ascending: false });

        if (error) {
            app().contenido.innerHTML = `
                <div class="alert alert-danger">
                    No se pudieron cargar las propiedades archivadas: ${h(error.message)}
                </div>`;
            return;
        }

        propiedades = data || [];
        mostrarListado();
    }

    function mostrarListado() {
        const archivadas = vistaActual === 'archivadas';

        app().contenido.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4 gap-2 flex-wrap">
                <div>
                    <h2 class="fw-bold">
                        ${archivadas ? 'Propiedades archivadas' : 'Propiedades'}
                    </h2>
                    <p class="text-muted mb-0">
                        ${archivadas
                            ? 'Consultá, restaurá o eliminá propiedades archivadas.'
                            : 'Administrá los inmuebles.'}
                    </p>
                </div>

                <div class="d-flex gap-2 flex-wrap">
                    ${
                        archivadas
                            ? `<button class="btn btn-outline-secondary" data-prop="activas">
                                ← Volver a propiedades
                               </button>`
                            : `
                                <button class="btn btn-outline-secondary" data-prop="archivadas">
                                    <i class="bi bi-archive me-1"></i> Ver archivadas
                                </button>
                                <button class="btn btn-dark" data-prop="nueva">
                                    + Nueva propiedad
                                </button>
                            `
                    }
                </div>
            </div>

            <input id="buscarPropiedad" class="form-control mb-3"
                placeholder="Buscar por título, código o dirección...">

            <div class="card border-0 shadow-sm">
                <div class="card-body table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Propiedad</th>
                                <th>Operación</th>
                                <th>Estado</th>
                                <th>Precio</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tablaPropiedades"></tbody>
                    </table>
                </div>
            </div>
        `;

        dibujarFilas();

        document.getElementById('buscarPropiedad')
            .addEventListener('input', dibujarFilas);
    }

    function dibujarFilas() {
        const buscar = document.getElementById('buscarPropiedad')
            ?.value.toLowerCase().trim() || '';

        const filtradas = propiedades.filter(p =>
            `${p.property_code} ${p.title} ${p.address} ${p.city}`
                .toLowerCase().includes(buscar)
        );

        document.getElementById('tablaPropiedades').innerHTML =
            filtradas.length
                ? filtradas.map(p => `
                    <tr>
                        <td>${h(p.property_code || '—')}</td>
                        <td>
                            <strong>${h(p.title)}</strong><br>
                            <small class="text-muted">${h(p.address)}</small>
                        </td>
                        <td>${h(p.operation)}</td>
                        <td>${h(p.status)}</td>
                        <td>${h(p.currency)} ${Number(p.price).toLocaleString('es-AR')}</td>
                        <td class="text-nowrap">
                            ${
                                vistaActual === 'archivadas'
                                    ? `
                                        <button class="btn btn-sm btn-outline-success"
                                            data-prop="restaurar" data-id="${h(p.id)}">
                                            <i class="bi bi-arrow-counterclockwise"></i>
                                            Restaurar
                                        </button>

                                        <button class="btn btn-sm btn-outline-danger"
                                            data-prop="eliminar-definitivo" data-id="${h(p.id)}">
                                            <i class="bi bi-trash"></i>
                                            Eliminar
                                        </button>
                                    `
                                    : `
                                        <button class="btn btn-sm btn-outline-dark"
                                            data-prop="editar" data-id="${h(p.id)}">
                                            Editar
                                        </button>

                                        ${
                                            app().esAdmin()
                                                ? `<button class="btn btn-sm btn-outline-danger"
                                                    data-prop="archivar" data-id="${h(p.id)}">
                                                    Archivar
                                                </button>`
                                                : ''
                                        }
                                    `
                            }
                        </td>
                    </tr>
                `).join('')
                : `<tr><td colspan="6" class="text-center text-muted">
                    ${vistaActual === 'archivadas'
                        ? 'No hay propiedades archivadas.'
                        : 'No hay propiedades para mostrar.'}
                </td></tr>`;
    }

    function normalizarImagen(imagen) {
        if (typeof imagen === 'string') {
            return { url: imagen, path: null };
        }

        return {
            url: imagen?.url || '',
            path: imagen?.path || null
        };
    }

    function obtenerPathImagen(imagen) {
        const normalizada = normalizarImagen(imagen);

        if (normalizada.path) return normalizada.path;

        try {
            const url = new URL(normalizada.url);
            const marcador = `/storage/v1/object/public/${BUCKET_IMAGENES}/`;
            const posicion = url.pathname.indexOf(marcador);

            if (posicion === -1) return null;

            return decodeURIComponent(
                url.pathname.substring(posicion + marcador.length)
            );
        } catch {
            return null;
        }
    }

    function generarUUID() {
        if (crypto.randomUUID) return crypto.randomUUID();

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    function nombreSeguro(nombre) {
        return nombre
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._-]/g, '_');
    }

    async function subirImagenes(idPropiedad, archivos) {
        const imagenes = [];

        for (const archivo of archivos) {
            const nombre = `${generarUUID()}-${nombreSeguro(archivo.name)}`;
            const path = `${idPropiedad}/${nombre}`;

            const { error } = await db()
                .storage
                .from(BUCKET_IMAGENES)
                .upload(path, archivo, {
                    contentType: archivo.type,
                    upsert: false
                });

            if (error) throw error;

            const { data } = db()
                .storage
                .from(BUCKET_IMAGENES)
                .getPublicUrl(path);

            imagenes.push({
                url: data.publicUrl,
                path,
                name: archivo.name
            });
        }

        return imagenes;
    }

    async function eliminarImagenesStorage(imagenes) {
        const paths = imagenes
            .map(obtenerPathImagen)
            .filter(Boolean);

        if (!paths.length) return null;

        const { error } = await db()
            .storage
            .from(BUCKET_IMAGENES)
            .remove(paths);

        return error;
    }

    async function eliminarDefinitivamente(propiedad) {
        if (!app().esAdmin()) {
            app().mensaje('Solo un administrador puede eliminar propiedades.', 'danger');
            return;
        }

        const confirmar = confirm(
            `¿Eliminar definitivamente "${propiedad.title}"?\n\n` +
            'Esta acción no se puede deshacer. Se eliminarán también sus fotografías.'
        );

        if (!confirmar) return;

        const boton = document.querySelector(
            `[data-prop="eliminar-definitivo"][data-id="${propiedad.id}"]`
        );

        if (boton) {
            boton.disabled = true;
            boton.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        }

        try {
            // Primero eliminamos el registro de la base de datos.
            const { data, error } = await db()
                .from('properties')
                .delete()
                .eq('id', propiedad.id)
                .select('id');

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error(
                    'No se pudo eliminar el registro. Verificá los permisos de eliminación de propiedades.'
                );
            }

            // Después eliminamos sus fotografías del Storage.
            const errorImagenes = await eliminarImagenesStorage(
                Array.isArray(propiedad.image_urls)
                    ? propiedad.image_urls
                    : []
            );

            await mostrarArchivadas();

            if (errorImagenes) {
                app().mensaje(
                    'La propiedad se eliminó, pero algunas fotografías no pudieron borrarse del almacenamiento.',
                    'warning'
                );
            } else {
                app().mensaje('Propiedad y fotografías eliminadas definitivamente.');
            }

        } catch (error) {
            console.error(error);

            app().mensaje(
                'No se pudo eliminar la propiedad: ' + error.message,
                'danger'
            );

            if (boton) {
                boton.disabled = false;
                boton.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
            }
        }
    }

    function formulario(p = {}) {
        const editando = Boolean(p.id);

        let imagenesExistentes = Array.isArray(p.image_urls)
            ? [...p.image_urls]
            : [];

        let imagenesAEliminar = [];
        let archivosSeleccionados = [];

        app().contenido.innerHTML = `
            <button class="btn btn-sm btn-outline-secondary mb-3"
                data-prop="volver">← Volver</button>

            <h2 class="fw-bold mb-4">
                ${editando ? 'Editar propiedad' : 'Nueva propiedad'}
            </h2>

            <form id="formPropiedad" class="card border-0 shadow-sm">
                <div class="card-body">
                    <div class="row g-3">

                        <div class="col-md-8">
                            <label class="form-label">Título *</label>
                            <input name="title" class="form-control" required
                                value="${h(p.title || '')}">
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Tipo *</label>
                            <select name="property_type" class="form-select">
                                ${tipos.map(t => `<option ${p.property_type === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Operación *</label>
                            <select name="operation" class="form-select">
                                ${operaciones.map(t => `<option ${p.operation === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Estado *</label>
                            <select name="status" class="form-select">
                                ${estados.map(t => `<option ${(p.status || 'Disponible') === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>

                        <div class="col-12">
                            <label class="form-label">Descripción</label>
                            <textarea name="description" class="form-control" rows="3">${h(p.description || '')}</textarea>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Precio *</label>
                            <input name="price" type="number" min="0" step="0.01"
                                class="form-control" required value="${h(p.price ?? 0)}">
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Moneda</label>
                            <select name="currency" class="form-select">
                                <option value="ARS" ${(!p.currency || p.currency === 'ARS') ? 'selected' : ''}>ARS</option>
                                <option value="USD" ${p.currency === 'USD' ? 'selected' : ''}>USD</option>
                            </select>
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Expensas</label>
                            <input name="monthly_expenses" type="number" min="0"
                                step="0.01" class="form-control"
                                value="${h(p.monthly_expenses ?? 0)}">
                        </div>

                        <div class="col-md-8">
                            <label class="form-label">Dirección *</label>
                            <input name="address" class="form-control" required
                                value="${h(p.address || '')}">
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Ciudad *</label>
                            <input name="city" class="form-control" required
                                value="${h(p.city || 'Concordia')}">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Provincia *</label>
                            <input name="province" class="form-control" required
                                value="${h(p.province || 'Entre Ríos')}">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Código postal</label>
                            <input name="postal_code" class="form-control"
                                value="${h(p.postal_code || '')}">
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Superficie cubierta (m²)</label>
                            <input name="covered_area" type="number" min="0" step="0.01"
                                class="form-control" value="${h(p.covered_area ?? '')}">
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Superficie total (m²)</label>
                            <input name="total_area" type="number" min="0" step="0.01"
                                class="form-control" value="${h(p.total_area ?? '')}">
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Ambientes</label>
                            <input name="rooms" type="number" min="0" step="1"
                                class="form-control" value="${h(p.rooms ?? 0)}">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Dormitorios</label>
                            <input name="bedrooms" type="number" min="0" step="1"
                                class="form-control" value="${h(p.bedrooms ?? 0)}">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Baños</label>
                            <input name="bathrooms" type="number" min="0" step="1"
                                class="form-control" value="${h(p.bathrooms ?? 0)}">
                        </div>

                        <div class="col-12">
                            <hr>
                            <h5 class="fw-bold">Fotografías de la propiedad</h5>
                            <p class="text-muted small">
                                Podés seleccionar varias imágenes. Formatos JPG, PNG o WebP.
                                Máximo 5 MB por archivo.
                            </p>

                            <input
                                id="imagenesPropiedad"
                                type="file"
                                class="form-control"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                            >

                            <div id="vistaImagenes" class="row g-3 mt-2"></div>
                        </div>
                    </div>

                    <div class="d-flex gap-2 mt-4">
                        <button class="btn btn-dark" type="submit">
                            ${editando ? 'Guardar cambios' : 'Crear propiedad'}
                        </button>
                        <button class="btn btn-outline-secondary" type="button"
                            data-prop="volver">Cancelar</button>
                    </div>
                </div>
            </form>
        `;

        const contenedorImagenes = document.getElementById('vistaImagenes');

        function dibujarImagenes() {
            const existentes = imagenesExistentes.map((imagen, indice) => {
                const normalizada = normalizarImagen(imagen);
                const eliminada = imagenesAEliminar.includes(indice);

                return `
                    <div class="col-6 col-md-4 col-lg-3">
                        <div class="position-relative border rounded overflow-hidden">
                            <img src="${h(normalizada.url)}"
                                class="w-100"
                                style="height:150px;object-fit:cover;${eliminada ? 'opacity:.3;' : ''}"
                                alt="Fotografía de la propiedad">

                            <button type="button"
                                class="btn btn-sm ${eliminada ? 'btn-success' : 'btn-danger'} position-absolute top-0 end-0 m-2"
                                data-imagen-existente="${indice}"
                                title="${eliminada ? 'Restaurar imagen' : 'Marcar para eliminar'}">
                                <i class="bi ${eliminada ? 'bi-arrow-counterclockwise' : 'bi-trash'}"></i>
                            </button>

                            ${eliminada ? '<span class="badge bg-danger position-absolute bottom-0 start-0 m-2">Se eliminará</span>' : ''}
                        </div>
                    </div>
                `;
            }).join('');

            const nuevas = archivosSeleccionados.map((item, indice) => `
                <div class="col-6 col-md-4 col-lg-3">
                    <div class="position-relative border rounded overflow-hidden">
                        <img src="${item.preview}"
                            class="w-100"
                            style="height:150px;object-fit:cover"
                            alt="Nueva fotografía">

                        <button type="button"
                            class="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                            data-imagen-nueva="${indice}"
                            title="Quitar imagen">
                            <i class="bi bi-trash"></i>
                        </button>

                        <span class="badge bg-success position-absolute bottom-0 start-0 m-2">
                            Nueva
                        </span>
                    </div>
                </div>
            `).join('');

            contenedorImagenes.innerHTML = existentes + nuevas;

            if (!existentes && !nuevas) {
                contenedorImagenes.innerHTML = `
                    <p class="text-muted small">Todavía no hay fotografías cargadas.</p>
                `;
            }
        }

        document.getElementById('imagenesPropiedad')
            .addEventListener('change', event => {
                const archivos = Array.from(event.target.files || []);

                for (const archivo of archivos) {
                    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
                        alert(`Formato no permitido: ${archivo.name}`);
                        continue;
                    }

                    if (archivo.size > MAX_TAMANO) {
                        alert(`La imagen supera los 5 MB: ${archivo.name}`);
                        continue;
                    }

                    archivosSeleccionados.push({
                        file: archivo,
                        preview: URL.createObjectURL(archivo)
                    });
                }

                event.target.value = '';
                dibujarImagenes();
            });

        contenedorImagenes.addEventListener('click', event => {
            const existente = event.target.closest('[data-imagen-existente]');

            if (existente) {
                const indice = Number(existente.dataset.imagenExistente);

                if (imagenesAEliminar.includes(indice)) {
                    imagenesAEliminar = imagenesAEliminar.filter(i => i !== indice);
                } else {
                    imagenesAEliminar.push(indice);
                }

                dibujarImagenes();
                return;
            }

            const nueva = event.target.closest('[data-imagen-nueva]');

            if (nueva) {
                const indice = Number(nueva.dataset.imagenNueva);
                const item = archivosSeleccionados[indice];

                if (item) URL.revokeObjectURL(item.preview);

                archivosSeleccionados.splice(indice, 1);
                dibujarImagenes();
            }
        });

        dibujarImagenes();

        document.getElementById('formPropiedad').addEventListener('submit', async event => {
            event.preventDefault();

            const form = event.currentTarget;
            const boton = form.querySelector('[type="submit"]');

            boton.disabled = true;
            boton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

            const datos = Object.fromEntries(new FormData(form).entries());

            for (const campo of [
                'price', 'monthly_expenses', 'covered_area',
                'total_area', 'rooms', 'bedrooms', 'bathrooms'
            ]) {
                if (datos[campo] === '' && ['covered_area', 'total_area'].includes(campo)) {
                    datos[campo] = null;
                } else {
                    datos[campo] = Number(datos[campo] || 0);
                }
            }

            if (
                datos.covered_area !== null &&
                datos.total_area !== null &&
                datos.covered_area > datos.total_area
            ) {
                alert('La superficie cubierta no puede superar la superficie total.');
                boton.disabled = false;
                boton.textContent = editando ? 'Guardar cambios' : 'Crear propiedad';
                return;
            }

            let archivosSubidos = [];
            let guardado = false;

            try {
                const idPropiedad = p.id || generarUUID();

                const imagenesRestantes = imagenesExistentes
                    .filter((_, indice) => !imagenesAEliminar.includes(indice));

                const archivos = archivosSeleccionados.map(item => item.file);

                if (archivos.length) {
                    archivosSubidos = await subirImagenes(idPropiedad, archivos);
                }

                const imagenesFinales = [
                    ...imagenesRestantes,
                    ...archivosSubidos
                ];

                const datosFinales = {
                    ...datos,
                    id: idPropiedad,
                    image_urls: imagenesFinales
                };

                const resultado = editando
                    ? await db()
                        .from('properties')
                        .update({
                            ...datos,
                            image_urls: imagenesFinales
                        })
                        .eq('id', idPropiedad)
                    : await db()
                        .from('properties')
                        .insert(datosFinales);

                if (resultado.error) throw resultado.error;

                guardado = true;

                const imagenesEliminadas = imagenesExistentes
                    .filter((_, indice) => imagenesAEliminar.includes(indice));

                const errorEliminacion = await eliminarImagenesStorage(imagenesEliminadas);

                archivosSeleccionados.forEach(item => {
                    URL.revokeObjectURL(item.preview);
                });

                await render();

                if (errorEliminacion) {
                    app().mensaje(
                        'La propiedad se guardó, pero algunas imágenes antiguas no pudieron eliminarse del almacenamiento.',
                        'warning'
                    );
                } else {
                    app().mensaje(
                        editando ? 'Propiedad actualizada.' : 'Propiedad creada.'
                    );
                }

            } catch (error) {
                console.error(error);

                if (!guardado && archivosSubidos.length) {
                    await eliminarImagenesStorage(archivosSubidos);
                }

                alert(
                    'No se pudo completar el guardado: ' +
                    error.message
                );

                boton.disabled = false;
                boton.textContent = editando ? 'Guardar cambios' : 'Crear propiedad';
            }
        });
    }

    document.addEventListener('click', async event => {
        const boton = event.target.closest('[data-prop]');
        if (!boton) return;

        const id = boton.dataset.id;
        const accion = boton.dataset.prop;

        if (accion === 'nueva') formulario();
        if (accion === 'volver' || accion === 'activas') render();
        if (accion === 'archivadas') mostrarArchivadas();

        if (accion === 'editar') {
            const p = propiedades.find(item => item.id === id);
            if (p) formulario(p);
        }

        if (accion === 'archivar') {
            if (!app().esAdmin()) {
                app().mensaje('Solo un administrador puede archivar propiedades.', 'danger');
                return;
            }

            const p = propiedades.find(item => item.id === id);
            if (!p || !confirm(`¿Archivar "${p.title}"?`)) return;

            const { error } = await db()
                .from('properties')
                .update({ archived_at: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                app().mensaje(error.message, 'danger');
            } else {
                await render();
                app().mensaje('Propiedad archivada.');
            }
        }

        if (accion === 'restaurar') {
            if (!app().esAdmin()) {
                app().mensaje('Solo un administrador puede restaurar propiedades.', 'danger');
                return;
            }

            const p = propiedades.find(item => item.id === id);
            if (!p) return;

            if (!confirm(`¿Restaurar "${p.title}"?`)) return;

            const { error } = await db()
                .from('properties')
                .update({ archived_at: null })
                .eq('id', id);

            if (error) {
                app().mensaje(error.message, 'danger');
            } else {
                await mostrarArchivadas();
                app().mensaje('Propiedad restaurada correctamente.');
            }
        }

        if (accion === 'eliminar-definitivo') {
            const p = propiedades.find(item => item.id === id);
            if (p) await eliminarDefinitivamente(p);
        }
    });

    window.SiandraModulos = window.SiandraModulos || {};
    window.SiandraModulos.propiedades = { render };
})();
