import React, { Suspense } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AlertTriangle, Compass } from 'lucide-react';
import { Button, Card, EmptyState, LoadingBlock, PageContainer } from '../ui';
import { ROUTES } from '../config/constants';

class ErrorBoundary extends React.Component<{ resetKey: string; children: React.ReactNode }, { error: Error | null }> {
    state = { error: null as Error | null };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('Route error:', error, info.componentStack);
    }

    componentDidUpdate(prev: { resetKey: string }) {
        if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <PageContainer narrow>
                <Card className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-3 text-center">
                    <div className="rounded-full bg-rose-100 p-3 text-rose-500 dark:bg-rose-500/10">
                        <AlertTriangle size={28} aria-hidden="true" />
                    </div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">Algo salió mal</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Ocurrió un error inesperado al mostrar esta página. Puedes reintentar o volver al inicio.
                    </p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                        <Button onClick={() => this.setState({ error: null })}>Reintentar</Button>
                        <Link to={ROUTES.DASHBOARD}><Button variant="outline">Ir al inicio</Button></Link>
                    </div>
                </Card>
            </PageContainer>
        );
    }
}

/** Outlet wrapper for layouts: lazy-page fallback plus an error boundary that resets on navigation. */
export const RouteBoundary: React.FC = () => {
    const { pathname } = useLocation();
    return (
        <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<LoadingBlock label="Cargando…" className="py-20" />}>
                <Outlet />
            </Suspense>
        </ErrorBoundary>
    );
};

export const NotFoundPage: React.FC = () => (
    <PageContainer>
        <EmptyState
            icon={Compass}
            className="py-24"
            title="Página no encontrada"
            description="La dirección que buscas no existe o fue movida."
            action={<Link to={ROUTES.DASHBOARD}><Button>Volver al inicio</Button></Link>}
        />
    </PageContainer>
);
