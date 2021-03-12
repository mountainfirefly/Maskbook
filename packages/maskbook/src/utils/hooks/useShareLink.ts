import { activatedSocialNetworkUI } from '../../social-network-next'

export function useShareLink(message: string) {
    switch (activatedSocialNetworkUI?.networkIdentifier) {
        case 'twitter.com':
            return `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
        case 'facebook.com':
            return `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(message)}&u=mask.io`
        default:
            return ''
    }
}
