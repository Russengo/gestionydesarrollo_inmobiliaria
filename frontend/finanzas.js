
(() => {
    const modulo = {
        async render() {
            const app = window.Siandra;
            const db = app.db;
            const contenido = app.contenido;

            contenido.innerHTML = `
                <div class="page-header mb-4">
                    <div>
                        <h1 class="page-title">Finanzas y cobros</h1>
                        <p class="muted-text mb-0">
                            Registro y seguimiento de pagos inmobiliarios.
                        </p>
                    </div>
                </div>

                <div id="finanzasMensaje"></div>

                <div class="row g-3 mb-4">
                    <div class="col-12 col-md-4">
                        <div class="admin-card stat-card">
                            <div class="stat-icon">
                                <i class="bi bi-hourglass-split"></i>
                            </div>
                            <div class="stat-value" id="pagosPendientes">—</div>
                            <div class="stat-label">Pagos pendientes</div>
                        </div>
                    </div>
                    <div class="col-12 col-md-4">
                        <div class="admin-card stat-card">
                            <div class="stat-icon">
                                <i class="bi bi-check-circle"></i>
                            </div>
                            <div class="stat-value" id="pagosRealizados">—</div>
                            <div class="stat-label">Pagos realizados</div>
                        </div>
                    </div>
                    <div class="col-12 col-md-4">
                        <div class="admin-card stat-card">
                            <div class="stat-icon">
                                <i class="bi bi-calendar-x"></i>
                            </div>
                            <div class="stat-value" id="pagosVencidos">—</div>
                            <div class="stat-label">Pagos vencidos</div>
                        </div>
                    </div>
                </div>

                <div class="admin-card p-4 mb-4">
                    <h2 class="section-heading">Registrar pago</h2>

                    <form id="formPago">
                        <div class="row g-3">
                            <div class="col-12 col-md-6">
                                <label for="pagoContrato" class="form-label">
                                    Contrato *
                                </label>
                                <select id="pagoContrato" name="contract_id"
                                    class="form-select" required>
                                    <option value="">Cargando contratos...</option>
                                </select>
                            </div>

                            <div class="col-12 col-md-6">
                                <label for="pagoConcepto" class="form-label">
                                    Concepto *
                                </label>
                                <input id="pagoConcepto" name="concept"
                                    class="form-control" maxlength="150"
                                    placeholder="Ej.: Alquiler de noviembre"
                                    required>
                            </div>

                            <div class="col-12 col-md-4">
                                <label for="pagoMonto" class="form-label">
                                    Importe *
                                </label>
                                <input id="pagoMonto" name="amount"
                                    type="number" class="form-control"
                                    min="0.01" step="0.01" required>
                            </div>

                            <div class="col-12 col-md-4">
                                <label for="pagoMoneda" class="form-label">
                                    Moneda *
                                </label>
                                <select id="pagoMoneda" name="currency"
                                    class="form-select" required>
                                    <option value="ARS">Pesos (ARS)</option>
                                    <option value="USD">Dólares (USD)</option>
                                </select>
                            </div>

                            <div class="col-12 col-md-4">
                                <label for="pagoVencimiento" class="form-label">
                                    Fecha de vencimiento *
                                </label>
                                <input id="pagoVencimiento" name="due_date"
                                    type="date" class="form-control" required>
                            </div>

                            <div class="col-12 col-md-6">
                                <label for="pagoMetodo" class="form-label">
                                    Medio de pago
                                </label>
                                <select id="pagoMetodo" name="payment_method"
                                    class="form-select">
                                    <option value="">Sin especificar</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia">Transferencia</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                    <option value="Otro">Otro</option>
                                </select>
                                <div class="form-text">
                                    Se puede indicar al registrar un pago ya realizado.
                                </div>
                            </div>

                            <div class="col-12 col-md-6">
                                <label for="pagoReferencia" class="form-label">
                                    Referencia o comprobante
                                </label>
                                <input id="pagoReferencia" name="reference"
                                    class="form-control" maxlength="200"
                                    placeholder="Número de operación, por ejemplo">
                            </div>

                            <div class="col-12">
                                <label for="pagoNotas" class="form-label">
                                    Observaciones
                                </label>
                                <textarea id="pagoNotas" name="notes"
                                    class="form-control" rows="2"
                                    placeholder="Información adicional"></textarea>
                            </div>

                            <div class="col-12">
                                <button type="submit" id="guardarPago"
                                    class="btn btn-gold">
                                    <i class="bi bi-plus-circle me-1"></i>
                                    Registrar pago pendiente
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="admin-card p-4">
                    <div class="d-flex flex-wrap justify-content-between
                        align-items-center gap-2 mb-3">
                        <h2 class="section-heading mb-0">Historial de pagos</h2>
                        <button id="recargarPagos" type="button"
                            class="btn btn-outline-secondary btn-sm">
                            <i class="bi bi-arrow-clockwise me-1"></i>
                            Actualizar
                        </button>
                    </div>

                    <div id="listaPagos">
                        <p class="muted-text">Cargando pagos...</p>
                    </div>
                </div>
            `;

            const zonaMensaje =
                document.getElementById('finanzasMensaje');

            function mensaje(texto, tipo = 'success') {
                zonaMensaje.innerHTML = `
                    <div class="alert alert-${tipo} alert-dismissible fade show"
                        role="alert">
                        ${app.escapar(texto)}
                        <button type="button" class="btn-close"
                            data-bs-dismiss="alert" aria-label="Cerrar"></button>
                    </div>
                `;
            }

            function fechaLocal() {
                const ahora = new Date();
                const ajuste = ahora.getTimezoneOffset() * 60000;
                return new Date(ahora.getTime() - ajuste)
                    .toISOString().slice(0, 10);
            }

            function mostrarFecha(valor) {
                if (!valor) return '—';
                const partes = valor.split('-');
                return partes.length === 3
                    ? `${partes[2]}/${partes[1]}/${partes[0]}`
                    : app.escapar(valor);
            }

            function formatoImporte(valor, moneda) {
                try {
                    return new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: moneda || 'ARS'
                    }).format(Number(valor || 0));
                } catch {
                    return `${moneda || 'ARS'} ${valor}`;
                }
            }

            async function cargarContratos() {
                const select = document.getElementById('pagoContrato');

                const { data, error } = await db
                    .from('contracts')
                    .select(`
                        id,
                        contract_type,
                        status,
                        amount,
                        currency,
                        properties (title, property_code),
                        people (full_name)
                    `)
                    .is('archived_at', null)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Error al cargar contratos:', error);
                    select.innerHTML =
                        '<option value="">Error al cargar contratos</option>';
                    mensaje('No se pudieron cargar los contratos.', 'danger');
                    return;
                }

                const contratos = data || [];

                select.innerHTML =
                    '<option value="">Seleccioná un contrato</option>' +
                    contratos.map(c => {
                        const propiedad =
                            c.properties?.title || 'Propiedad sin título';
                        const persona =
                            c.people?.full_name || 'Sin persona';
                        const texto =
                            `${propiedad} — ${persona} (${c.contract_type})`;

                        return `<option value="${app.escapar(c.id)}"
                            data-currency="${app.escapar(c.currency || 'ARS')}">
                            ${app.escapar(texto)}
                        </option>`;
                    }).join('');

                if (contratos.length === 0) {
                    select.innerHTML =
                        '<option value="">No hay contratos disponibles</option>';
                }
            }

            document.getElementById('pagoContrato')
                .addEventListener('change', event => {
                    const opcion = event.target.selectedOptions[0];
                    if (opcion?.dataset.currency) {
                        document.getElementById('pagoMoneda').value =
                            opcion.dataset.currency;
                    }
                });

            async function cargarPagos() {
                const lista = document.getElementById('listaPagos');
                lista.innerHTML =
                    '<p class="muted-text">Cargando pagos...</p>';

                const { data, error } = await db
                    .from('payments')
                    .select(`
                        id,
                        contract_id,
                        concept,
                        amount,
                        currency,
                        due_date,
                        paid_at,
                        status,
                        payment_method,
                        reference,
                        notes,
                        created_at,
                        contracts (
                            contract_type,
                            properties (title, property_code),
                            people (full_name)
                        )
                    `)
                    .is('archived_at', null)
                    .order('due_date', { ascending: true });

                if (error) {
                    console.error('Error al consultar pagos:', error);
                    lista.innerHTML = `
                        <div class="alert alert-danger">
                            No se pudieron cargar los pagos. Revisá la consola
                            del navegador para ver el error.
                        </div>`;
                    return;
                }

                const pagos = data || [];
                const hoy = fechaLocal();

                const estaVencido = pago =>
                    pago.status === 'Vencido' ||
                    (pago.status === 'Pendiente' &&
                        pago.due_date < hoy);

                document.getElementById('pagosPendientes').textContent =
                    pagos.filter(p => p.status === 'Pendiente').length;

                document.getElementById('pagosRealizados').textContent =
                    pagos.filter(p => p.status === 'Pagado').length;

                document.getElementById('pagosVencidos').textContent =
                    pagos.filter(estaVencido).length;

                if (pagos.length === 0) {
                    lista.innerHTML = `
                        <div class="text-center py-4">
                            <i class="bi bi-cash-stack fs-1 text-secondary"></i>
                            <p class="muted-text mt-2 mb-0">
                                Todavía no hay pagos registrados.
                            </p>
                        </div>`;
                    return;
                }

                const escapar = app.escapar;

                lista.innerHTML = `
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Concepto</th>
                                    <th>Contrato / Persona</th>
                                    <th>Importe</th>
                                    <th>Vencimiento</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pagos.map(p => {
                                    const contrato = p.contracts;
                                    const propiedad =
                                        contrato?.properties?.title ||
                                        'Propiedad no disponible';
                                    const persona =
                                        contrato?.people?.full_name ||
                                        'Persona no disponible';

                                    let estadoVisible = p.status;
                                    if (estaVencido(p) &&
                                        p.status === 'Pendiente') {
                                        estadoVisible = 'Vencido';
                                    }

                                    const color = {
                                        Pendiente: 'warning',
                                        Pagado: 'success',
                                        Vencido: 'danger',
                                        Cancelado: 'secondary'
                                    }[estadoVisible] || 'secondary';

                                    const opciones = [
                                        'Pendiente',
                                        'Pagado',
                                        'Vencido',
                                        'Cancelado'
                                    ];

                                    return `
                                        <tr>
                                            <td>
                                                <strong>${escapar(p.concept)}</strong>
                                                ${p.payment_method ? `
                                                    <div class="small text-secondary">
                                                        ${escapar(p.payment_method)}
                                                    </div>` : ''}
                                                ${p.reference ? `
                                                    <div class="small text-secondary">
                                                        Ref.: ${escapar(p.reference)}
                                                    </div>` : ''}
                                            </td>
                                            <td>
                                                ${escapar(propiedad)}
                                                <div class="small text-secondary">
                                                    ${escapar(persona)}
                                                </div>
                                            </td>
                                            <td>
                                                <strong>${escapar(
                                                    formatoImporte(p.amount, p.currency)
                                                )}</strong>
                                            </td>
                                            <td>
                                                ${mostrarFecha(p.due_date)}
                                                ${p.paid_at ? `
                                                    <div class="small text-success">
                                                        Pagado: ${mostrarFecha(
                                                            p.paid_at.slice(0, 10)
                                                        )}
                                                    </div>` : ''}
                                            </td>
                                            <td>
                                                <span class="badge text-bg-${color}">
                                                    ${escapar(estadoVisible)}
                                                </span>
                                            </td>
                                            <td>
                                                <select class="form-select form-select-sm estado-pago mb-1"
                                                    data-id="${escapar(p.id)}"
                                                    aria-label="Cambiar estado del pago">
                                                    ${opciones.map(estado => `
                                                        <option value="${estado}"
                                                            ${p.status === estado
                                                                ? 'selected' : ''}>
                                                            ${estado}
                                                        </option>
                                                    `).join('')}
                                                </select>
                                            </td>
                                        </tr>
                                        ${p.notes ? `
                                            <tr>
                                                <td colspan="6"
                                                    class="small text-secondary pt-0">
                                                    <i class="bi bi-chat-left-text me-1"></i>
                                                    ${escapar(p.notes)}
                                                </td>
                                            </tr>` : ''}
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    <p class="small text-secondary mb-0">
                        Total de registros: ${pagos.length}.
                        Los vencimientos se calculan según la fecha local
                        del navegador; un pago pendiente vencido se muestra
                        como vencido sin modificar automáticamente la base.
                    </p>
                `;

                lista.querySelectorAll('.estado-pago')
                    .forEach(select => {
                        select.addEventListener('change', async () => {
                            const pago = pagos.find(
                                p => p.id === select.dataset.id
                            );
                            if (!pago) return;

                            const estadoAnterior = pago.status;
                            const estadoNuevo = select.value;

                            const confirmado = confirm(
                                `¿Cambiar el estado de este pago a "${estadoNuevo}"?`
                            );

                            if (!confirmado) {
                                select.value = estadoAnterior;
                                return;
                            }

                            select.disabled = true;

                            const actualizacion = {
                                status: estadoNuevo,
                                paid_at: estadoNuevo === 'Pagado'
                                    ? (pago.paid_at || new Date().toISOString())
                                    : null,
                                updated_by: app.usuario()?.id || null,
                                updated_at: new Date().toISOString()
                            };

                            const { error: errorActualizar } = await db
                                .from('payments')
                                .update(actualizacion)
                                .eq('id', pago.id);

                            select.disabled = false;

                            if (errorActualizar) {
                                console.error(
                                    'Error al actualizar el pago:',
                                    errorActualizar
                                );
                                mensaje(
                                    'No se pudo actualizar el pago. Revisá los datos y los permisos.',
                                    'danger'
                                );
                                select.value = estadoAnterior;
                                return;
                            }

                            mensaje('Estado del pago actualizado correctamente.');
                            await cargarPagos();
                        });
                    });
            }

            document.getElementById('formPago')
                .addEventListener('submit', async event => {
                    event.preventDefault();

                    const formulario = event.currentTarget;
                    const boton = document.getElementById('guardarPago');
                    const campos = new FormData(formulario);

                    const monto = Number(campos.get('amount'));
                    const vencimiento = campos.get('due_date');

                    if (!Number.isFinite(monto) || monto <= 0) {
                        mensaje('El importe debe ser mayor que cero.', 'warning');
                        return;
                    }

                    if (!vencimiento) {
                        mensaje('Seleccioná la fecha de vencimiento.', 'warning');
                        return;
                    }

                    const pago = {
                        contract_id: campos.get('contract_id'),
                        concept: String(campos.get('concept') || '').trim(),
                        amount: monto,
                        currency: campos.get('currency'),
                        due_date: vencimiento,
                        status: 'Pendiente',
                        paid_at: null,
                        payment_method: campos.get('payment_method') || null,
                        reference: String(campos.get('reference') || '').trim() || null,
                        notes: String(campos.get('notes') || '').trim() || null,
                        created_by: app.usuario()?.id || null,
                        updated_by: app.usuario()?.id || null
                    };

                    boton.disabled = true;
                    boton.textContent = 'Guardando...';

                    const { error } = await db
                        .from('payments')
                        .insert(pago);

                    boton.disabled = false;
                    boton.innerHTML =
                        '<i class="bi bi-plus-circle me-1"></i> Registrar pago pendiente';

                    if (error) {
                        console.error('Error al registrar el pago:', error);
                        mensaje(
                            'No se pudo registrar el pago. Revisá los datos y la consola.',
                            'danger'
                        );
                        return;
                    }

                    mensaje('Pago registrado correctamente.');
                    formulario.reset();

                    await cargarContratos();
                    await cargarPagos();
                });

            document.getElementById('recargarPagos')
                .addEventListener('click', async () => {
                    await cargarContratos();
                    await cargarPagos();
                });

            await cargarContratos();
            await cargarPagos();
        }
    };

    window.SiandraModulos = window.SiandraModulos || {};
    window.SiandraModulos.finanzas = modulo;
})();
