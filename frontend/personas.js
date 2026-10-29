(() => {
    const app = () => window.Siandra;
    const db = () => app().db;
    const h = texto => app().escapar(texto);

    let personas = [];

    async function render() {
        const contenedor = app().contenido;
        contenedor.innerHTML = '<p>Cargando personas...</p>';

        const { data, error } = await db()
            .from('people')
            .select('*')
            .is('archived_at', null)
            .order('created_at', { ascending: false });

        if (error) {
            contenedor.innerHTML = `
                <div class="alert alert-danger">
                    No se pudieron cargar las personas: ${h(error.message)}
                </div>`;
            return;
        }

        personas = data || [];
        mostrarListado();
    }

    function mostrarListado() {
        app().contenido.innerHTML = `
            <div class="d-flex justify-content-between align-items-center gap-2 mb-4">
                <div>
                    <h2 class="fw-bold">Personas</h2>
                    <p class="text-muted mb-0">Clientes y propietarios.</p>
                </div>
                <button class="btn btn-dark" data-persona="nueva">
                    + Nueva persona
                </button>
            </div>

            <input id="buscarPersona" class="form-control mb-3"
                placeholder="Buscar por nombre, correo o teléfono...">

            <div class="card border-0 shadow-sm">
                <div class="card-body table-responsive">
                    <table class="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Correo</th>
                                <th>Teléfono</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tablaPersonas"></tbody>
                    </table>
                </div>
            </div>
        `;

        dibujarFilas();

        document.getElementById('buscarPersona')
            .addEventListener('input', dibujarFilas);
    }

    function dibujarFilas() {
        const buscar = document.getElementById('buscarPersona')
            ?.value.toLowerCase().trim() || '';

        const filtradas = personas.filter(p =>
            `${p.full_name} ${p.email || ''} ${p.phone || ''} ${p.person_type}`
                .toLowerCase().includes(buscar)
        );

        document.getElementById('tablaPersonas').innerHTML =
            filtradas.length
                ? filtradas.map(p => `
                    <tr>
                        <td class="fw-semibold">${h(p.full_name)}</td>
                        <td>${h(p.person_type)}</td>
                        <td>${h(p.email || '—')}</td>
                        <td>${h(p.phone || '—')}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-dark"
                                data-persona="editar" data-id="${h(p.id)}">
                                Editar
                            </button>
                        </td>
                    </tr>
                `).join('')
                : `<tr><td colspan="5" class="text-center text-muted">
                    No se encontraron personas.
                </td></tr>`;
    }

    function formulario(p = {}) {
        const editando = Boolean(p.id);

        app().contenido.innerHTML = `
            <button class="btn btn-sm btn-outline-secondary mb-3"
                data-persona="volver">← Volver</button>

            <h2 class="fw-bold mb-4">
                ${editando ? 'Editar persona' : 'Nueva persona'}
            </h2>

            <form id="formPersona" class="card border-0 shadow-sm">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Nombre completo *</label>
                            <input name="full_name" class="form-control"
                                required value="${h(p.full_name || '')}">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Tipo *</label>
                            <select name="person_type" class="form-select">
                                ${['Cliente', 'Propietario', 'Ambos'].map(tipo => `
                                    <option ${ (p.person_type || 'Cliente') === tipo ? 'selected' : ''}>
                                        ${tipo}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Correo electrónico</label>
                            <input name="email" type="email" class="form-control"
                                value="${h(p.email || '')}">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label">Teléfono</label>
                            <input name="phone" type="tel" class="form-control"
                                value="${h(p.phone || '')}">
                        </div>

                        <div class="col-md-4">
                            <label class="form-label">Tipo de documento</label>
                            <select name="document_type" class="form-select">
                                <option value="">Sin especificar</option>
                                ${['DNI', 'CUIT', 'CUIL', 'Pasaporte'].map(tipo => `
                                    <option value="${tipo}"
                                        ${p.document_type === tipo ? 'selected' : ''}>
                                        ${tipo}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="col-md-8">
                            <label class="form-label">Número de documento</label>
                            <input name="document_number" class="form-control"
                                value="${h(p.document_number || '')}">
                        </div>

                        <div class="col-12">
                            <label class="form-label">Observaciones</label>
                            <textarea name="notes" class="form-control" rows="3">${h(p.notes || '')}</textarea>
                        </div>
                    </div>

                    <div class="d-flex gap-2 mt-4">
                        <button type="submit" class="btn btn-dark">
                            ${editando ? 'Guardar cambios' : 'Registrar persona'}
                        </button>
                        <button type="button" class="btn btn-outline-secondary"
                            data-persona="volver">Cancelar</button>
                    </div>
                </div>
            </form>
        `;

        document.getElementById('formPersona').addEventListener('submit', async event => {
            event.preventDefault();

            const form = event.currentTarget;
            const boton = form.querySelector('[type="submit"]');
            boton.disabled = true;

            const datos = Object.fromEntries(new FormData(form).entries());

            for (const campo of [
                'email', 'phone', 'document_type',
                'document_number', 'notes'
            ]) {
                datos[campo] = datos[campo].trim() || null;
            }

            try {
                const resultado = editando
                    ? await db().from('people').update(datos).eq('id', p.id)
                    : await db().from('people').insert(datos);

                if (resultado.error) throw resultado.error;

                await render();
                app().mensaje(
                    editando ? 'Persona actualizada.' : 'Persona registrada.'
                );
            } catch (error) {
                console.error(error);
                alert('No se pudo guardar: ' + error.message);
                boton.disabled = false;
            }
        });
    }

    document.addEventListener('click', event => {
        const boton = event.target.closest('[data-persona]');
        if (!boton) return;

        const accion = boton.dataset.persona;
        const id = boton.dataset.id;

        if (accion === 'nueva') formulario();
        if (accion === 'volver') render();

        if (accion === 'editar') {
            const persona = personas.find(p => p.id === id);
            if (persona) formulario(persona);
        }
    });

    window.SiandraModulos = window.SiandraModulos || {};
    window.SiandraModulos.personas = { render };
})();