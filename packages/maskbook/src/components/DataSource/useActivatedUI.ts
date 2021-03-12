import type { Profile } from '../../database'
import { useValueRef } from '../../utils/hooks/useValueRef'
import { activatedSocialNetworkUI, globalUIState } from '../../social-network-next'
import { currentSelectedIdentity } from '../../settings/settings'
import { useMemo, useRef } from 'react'
import { ValueRef } from '@dimensiondev/holoflows-kit'
import type { SocialNetworkUI } from '../../social-network-next'
import { ProfileIdentifier } from '@dimensiondev/maskbook-shared'

export function useFriendsList() {
    const ref = useValueRef(globalUIState.friends)
    return useMemo(() => [...ref.values()], [ref])
}
export function useLastRecognizedIdentity() {
    const def = useRef(new ValueRef({ identifier: ProfileIdentifier.unknown })).current
    return useValueRef<SocialNetworkUI.CollectingCapabilities.IdentityResolved>(
        activatedSocialNetworkUI.collecting.identityProvider?.lastRecognized || def,
    )
}
export function useMyIdentities() {
    return useValueRef(globalUIState.profiles)
}
export function useCurrentIdentity(noDefault?: boolean): Profile | null {
    const all = useMyIdentities()
    const current = useValueRef(currentSelectedIdentity[activatedSocialNetworkUI.networkIdentifier])
    return all.find((i) => i.identifier.toText() === current) || (noDefault ? null : all[0])
}
