
(() => {
    const app = () => window.Siandra;
    const db = () => app().db;
    const h = texto => app().escapar(texto);

    let visitas = [];
    let propiedades = [];
    let personas = [];

    async function render() {
        const contenido = app().contenido;

        contenido.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Visitas y agenda</h1>
                    <p class="muted-text">
                        Organizá las visitas a las propiedades.
                    </p>
                </div>
            </div>

            <div id="formVisitaContainer" class="admin-card p-4 mb-4">
                <h2 class="section-heading">Programar una visita</h2>

                <form id="formVisita">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Propiedad *</label>
                            <select class="form-select" name="property_id" required>
                                <option value="">Cargando propiedades...</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Persona *</label>
                            <select class="form-select" name="person_id" required>
                                <option value="">Cargando personas...</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Fecha y hora *</label>
                            <input
                                class="form-control"
                                type="datetime-local"
                                name="scheduled_at"
                                required
                            >
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Agente asignado</label>
                            <select class="form-select" name="assigned_to">
                                <option value="">Sin asignar</option>
                            </select>
                        </div>

                        <div class="col-12">
                            <label class="form-label">Observaciones</label>
                            <textarea
                                class="form-control"
                                name="notes"
                                rows="2"
                                placeholder="Detalles de la visita..."
                            ></textarea>
                        </div>

                        <div class="col-12">
                            <button class="btn btn-gold" type="submit">
                                <i class="bi bi-calendar-plus me-1"></i>
                                Programar visita
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div class="admin-card p-4">
                <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
                    <h2 class="section-heading mb-0">Visitas registradas</h2>
                    <button class="btn btn-outline-secondary btn-sm" id="recargarVisitas">
                        <i class="bi bi-arrow-clockwise me-1"></i>
                        Actualizar
                    </button>
                </div>

                <div id="listaVisitas">
                    <p class="text-muted">Cargando visitas...</p>
                </div>
            </div>
        `;

        await cargarOpciones();
        await cargarVisitas();

        contenido.querySelector('#formVisita')
            .addEventListener('submit', guardarVisita);

        contenido.querySelector('#recargarVisitas')
            .addEventListener('click', cargarVisitas);

        contenido.querySelector('#listaVisitas')
            .addEventListener('change', cambiarEstado);
    }

    async function cargarOpciones() {
        const contenido = app().contenido;

        const [resPropiedades, resPersonas, resUsuarios] = await Promise.all([
            db().from('properties')
                .select('id, property_code, title, address, city')
                .is('archived_at', null)
                .order('title'),

            db().from('people')
                .select('id, full_name')
                .is('archived_at', null)
                .order('full_name'),

            db().from('profiles')
                .select('id, full_name, role')
                .order('full_name')
        ]);

        if (resPropiedades.error || resPersonas.error || resUsuarios.error) {
            console.error(
                'Error cargando opciones:',
                resPropiedades.error || resPersonas.error || resUsuarios.error
            );

            app().mensaje(
                'No se pudieron cargar las propiedades, personas o agentes. Revisá los permisos de Supabase.',
                'danger'
            );
            return;
        }

        propiedades = resPropiedades.data || [];
        personas = resPersonas.data || [];

        const selectPropiedad = contenido.querySelector('[name="property_id"]');
        const selectPersona = contenido.querySelector('[name="person_id"]');
        const selectAgente = contenido.querySelector('[name="assigned_to"]');

        selectPropiedad.innerHTML = `
            <option value="">Seleccioná una propiedad</option>
            ${propiedades.map(p => `
                <option value="${h(p.id)}">
                    ${h(p.property_code || '')} — ${h(p.title)}
                </option>
            `).join('')}
        `;

        selectPersona.innerHTML = `
            <option value="">Seleccioná una persona</option>
            ${personas.map(p => `
                <option value="${h(p.id)}">${h(p.full_name)}</option>
            `).join('')}
        `;

        selectAgente.innerHTML += (resUsuarios.data || []).map(u => `
            <option value="${h(u.id)}">
                ${h(u.full_name || u.id)}${u.role === 'admin' ? ' (Admin)' : ''}
            </option>
        `).join('');

        if (!propiedades.length || !personas.length) {
            app().mensaje(
                'Para programar una visita, primero necesitás al menos una propiedad y una persona registradas.',
                'warning'
            );
        }
    }

    async function cargarVisitas() {
        const lista = app().contenido.querySelector('#listaVisitas');
        if (!lista) return;

        lista.innerHTML = '<p class="text-muted">Cargando visitas...</p>';

        const { data, error } = await db()
            .from('visits')
            .select(`
                id,
                property_id,
                person_id,
                scheduled_at,
                status,
                notes,
                assigned_to,
                properties (title, property_code, address),
                people (full_name),
                profiles:assigned_to (full_name)
            `)
            .is('archived_at', null)
            .order('scheduled_at', { ascending: true });

        if (error) {
            console.error('Error cargando visitas:', error);
            lista.innerHTML = `
                <div class="alert alert-danger">
                    No se pudieron cargar las visitas. Revisá la consola.
                </div>
            `;
            return;
        }

        visitas = data || [];
        mostrarVisitas();
    }

    function mostrarVisitas() {
        const lista = app().contenido.querySelector('#listaVisitas');
        if (!lista) return;

        if (!visitas.length) {
            lista.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-calendar-x fs-1 text-secondary"></i>
                    <p class="text-muted mt-2 mb-0">
                        Todavía no hay visitas registradas.
                    </p>
                </div>
            `;
            return;
        }

        lista.innerHTML = `
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Propiedad</th>
                            <th>Persona</th>
                            <th>Agente</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${visitas.map(v => `
                            <tr>
                                <td>${h(new Date(v.scheduled_at).toLocaleString('es-AR'))}</td>
                                <td>
                                    <strong>${h(v.properties?.title || 'Propiedad')}</strong>
                                    <div class="small text-muted">
                                        ${h(v.properties?.property_code || '')}
                                    </div>
                                </td>
                                <td>${h(v.people?.full_name || 'Persona')}</td>
                                <td>${h(v.profiles?.full_name || 'Sin asignar')}</td>
                                <td>
                                    <select
                                        class="form-select form-select-sm"
                                        data-visita-estado="${h(v.id)}"
                                        aria-label="Cambiar estado de visita"
                                    >
                                        ${['Pendiente', 'Confirmada', 'Realizada', 'Cancelada']
                                            .map(estado => `
                                                <option
                                                    value="${estado}"
                                                    ${v.status === estado ? 'selected' : ''}
                                                >${estado}</option>
                                            `).join('')}
                                    </select>
                                </td>
                            </tr>
                            ${v.notes ? `
                                <tr>
                                    <td colspan="5" class="small text-muted pt-0">
                                        <i class="bi bi-chat-left-text me-1"></i>
                                        ${h(v.notes)}
                                    </td>
                                </tr>
                            ` : ''}
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async function guardarVisita(event) {
        event.preventDefault();

        const formulario = event.currentTarget;
        const datos = new FormData(formulario);

        const fecha = datos.get('scheduled_at');

        const nuevaVisita = {
            property_id: datos.get('property_id'),
            person_id: datos.get('person_id'),
            scheduled_at: new Date(fecha).toISOString(),
            notes: datos.get('notes').trim() || null,
            assigned_to: datos.get('assigned_to') || null,
            created_by: app().usuario().id,
            updated_by: app().usuario().id
        };

        const boton = formulario.querySelector('[type="submit"]');
        boton.disabled = true;

        const { error } = await db()
            .from('visits')
            .insert(nuevaVisita);

        boton.disabled = false;

        if (error) {
            console.error('Error guardando visita:', error);
            app().mensaje('No se pudo guardar la visita: ' + error.message, 'danger');
            return;
        }

        app().mensaje('Visita programada correctamente.');
        formulario.reset();
        await cargarVisitas();
    }

    async function cambiarEstado(event) {
        const select = event.target.closest('[data-visita-estado]');
        if (!select) return;

        const id = select.dataset.visitaEstado;
        const estadoAnterior = visitas.find(v => v.id === id)?.status;
        const estadoNuevo = select.value;

        const { error } = await db()
            .from('visits')
            .update({
                status: estadoNuevo,
                updated_by: app().usuario().id,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error actualizando visita:', error);
            app().mensaje('No se pudo cambiar el estado: ' + error.message, 'danger');
            select.value = estadoAnterior || 'Pendiente';
            return;
        }

        const visita = visitas.find(v => v.id === id);
        if (visita) visita.status = estadoNuevo;

        app().mensaje('Estado de la visita actualizado.');
    }

    window.SiandraModulos = window.SiandraModulos || {};
    window.SiandraModulos.visitas = { render };
})();
