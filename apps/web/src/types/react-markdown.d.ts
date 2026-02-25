import 'react-markdown';

declare module 'react-markdown' {
    interface Components {
        wynnMuted: React.JSX.IntrinsicElements['p'];
    }
}