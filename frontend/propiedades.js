(() => {
    const app = () => window.Siandra;
    const db = () => app().db;
    const h = texto => app().escapar(texto);

    const tipos = ['Casa', 'Departamento', 'Terreno', 'Local', 'Galpón'];
    const operaciones = ['Venta', 'Alquiler', 'Ambas'];
    const estados = ['Disponible', 'Reservada', 'Alquilada', 'Vendida', 'Pausada'];

    let propiedades = [];

    async function render() {
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

    function mostrarListado() {
        app().contenido.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4 gap-2">
                <div>
                    <h2 class="fw-bold">Propiedades</h2>
                    <p class="text-muted mb-0">Administrá los inmuebles.</p>
                </div>
                <button class="btn btn-dark" data-prop="nueva">
                    + Nueva propiedad
                </button>
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
                        </td>
                    </tr>
                `).join('')
                : `<tr><td colspan="6" class="text-center text-muted">
                    No hay propiedades para mostrar.
                </td></tr>`;
    }

    function formulario(p = {}) {
        const editando = Boolean(p.id);

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
                                ${estados.map(t => `<option ${ (p.status || 'Disponible') === t ? 'selected' : ''}>${t}</option>`).join('')}
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

        document.getElementById('formPropiedad').addEventListener('submit', async event => {
            event.preventDefault();

            const form = event.currentTarget;
            const boton = form.querySelector('[type="submit"]');
            boton.disabled = true;

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
                return;
            }

            try {
                const resultado = editando
                    ? await db().from('properties').update(datos).eq('id', p.id)
                    : await db().from('properties').insert(datos);

                if (resultado.error) throw resultado.error;

                await render();
                app().mensaje(
                    editando ? 'Propiedad actualizada.' : 'Propiedad creada.'
                );
            } catch (error) {
                console.error(error);
                alert('No se pudo guardar: ' + error.message);
                boton.disabled = false;
            }
        });
    }

    document.addEventListener('click', async event => {
        const boton = event.target.closest('[data-prop]');
        if (!boton) return;

        const id = boton.dataset.id;
        const accion = boton.dataset.prop;

        if (accion === 'nueva') formulario();
        if (accion === 'volver') render();

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
    });

    window.SiandraModulos = window.SiandraModulos || {};
    window.SiandraModulos.propiedades = { render };
})();