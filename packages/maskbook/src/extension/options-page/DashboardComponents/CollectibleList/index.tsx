import { createContext, useState } from 'react'
import { FixedSizeGrid } from 'react-window'
import AutoResize from 'react-virtualized-auto-sizer'
import { Box, Button, CircularProgress, makeStyles, Skeleton, Typography } from '@material-ui/core'
import { CollectibleCard } from './CollectibleCard'
import type { WalletRecord } from '../../../../plugins/Wallet/database/types'
import { formatEthereumAddress } from '../../../../plugins/Wallet/formatter'
import { EthereumTokenType } from '../../../../web3/types'
import { useValueRef } from '../../../../utils/hooks/useValueRef'
import { currentCollectibleDataProviderSettings } from '../../../../plugins/Wallet/settings'
import { useAccount } from '../../../../web3/hooks/useAccount'
import { useCollectibles } from '../../../../plugins/Wallet/hooks/useCollectibles'
import { Flags } from '../../../../utils/flags'

export const CollectibleContext = createContext<{
    collectiblesRetry: () => void
}>(null!)

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    card: {
        position: 'relative',
        padding: theme.spacing(1),
    },
    description: {
        textAlign: 'center',
        marginTop: theme.spacing(0.5),
        maxWidth: 160,
    },
    loading: {
        position: 'absolute',
        bottom: 6,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
}))

export interface CollectibleListProps {
    wallet: WalletRecord
}

export function CollectibleList(props: CollectibleListProps) {
    const { wallet } = props

    const classes = useStyles()
    const account = useAccount()

    const [page, setPage] = useState(1)
    const provider = useValueRef(currentCollectibleDataProviderSettings)
    const {
        value: collectibles = [],
        loading: collectiblesLoading,
        retry: collectiblesRetry,
        error: collectiblesError,
    } = useCollectibles(account, provider, page)

    if (collectiblesLoading && page === 1)
        return (
            <Box className={classes.root}>
                {new Array(4).fill(0).map((_, i) => (
                    <Box className={classes.card} display="flex" flexDirection="column" key={i}>
                        <Skeleton animation="wave" variant="rectangular" width={160} height={220}></Skeleton>
                        <Skeleton
                            animation="wave"
                            variant="text"
                            width={160}
                            height={20}
                            style={{ marginTop: 4 }}></Skeleton>
                    </Box>
                ))}
            </Box>
        )

    if (collectiblesError || collectibles.length === 0)
        return (
            <Box
                className={classes.root}
                sx={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                }}>
                <Typography color="textSecondary">No collectible found.</Typography>
                <Button
                    sx={{
                        marginTop: 1,
                    }}
                    variant="text"
                    onClick={() => collectiblesRetry()}>
                    Retry
                </Button>
            </Box>
        )

    const dataSource = collectibles.filter((x) => {
        const key = `${formatEthereumAddress(x.address)}_${x.tokenId}`
        switch (x.type) {
            case EthereumTokenType.ERC721:
                return wallet.erc721_token_blacklist ? !wallet.erc721_token_blacklist.has(key) : true
            case EthereumTokenType.ERC1155:
                return wallet.erc1155_token_blacklist ? !wallet.erc1155_token_blacklist.has(key) : true
            default:
                return false
        }
    })

    return (
        <CollectibleContext.Provider value={{ collectiblesRetry }}>
            {Flags.transactions_pagination ? (
                <>
                    <AutoResize>
                        {({ width, height }) => {
                            return (
                                <FixedSizeGrid
                                    columnWidth={176}
                                    rowHeight={260}
                                    columnCount={4}
                                    height={height - 40}
                                    onItemsRendered={({
                                        overscanRowStopIndex,
                                        overscanColumnStopIndex,
                                        visibleRowStopIndex,
                                        visibleColumnStopIndex,
                                    }) => {
                                        if (dataSource.length === 0 || collectiblesError || collectiblesLoading) return
                                        if (
                                            visibleColumnStopIndex === overscanColumnStopIndex &&
                                            visibleRowStopIndex === overscanRowStopIndex &&
                                            visibleRowStopIndex === Math.ceil(dataSource.length / 4) - 1
                                        ) {
                                            setPage((x) => x + 1)
                                        }
                                    }}
                                    rowCount={Math.ceil(dataSource.length / 4)}
                                    width={width}>
                                    {({ columnIndex, rowIndex, style }) => {
                                        const y = dataSource[rowIndex * 4 + columnIndex]
                                        if (y) {
                                            return (
                                                <div className={classes.card} key={y.tokenId} style={style}>
                                                    <CollectibleCard token={y} wallet={wallet} provider={provider} />
                                                    <div className={classes.description}>
                                                        <Typography color="textSecondary" variant="body2">
                                                            {y.asset?.name ?? y.name}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                </FixedSizeGrid>
                            )
                        }}
                    </AutoResize>
                    {collectiblesLoading && (
                        <Box className={classes.loading}>
                            <CircularProgress size={25} />
                        </Box>
                    )}
                </>
            ) : (
                <Box className={classes.root}>
                    {dataSource.map((x) => (
                        <div className={classes.card} key={x.tokenId}>
                            <CollectibleCard token={x} provider={provider} wallet={wallet} />
                            <div className={classes.description}>
                                <Typography color="textSecondary" variant="body2">
                                    {x.asset?.name ?? x.name}
                                </Typography>
                            </div>
                        </div>
                    ))}
                </Box>
            )}
        </CollectibleContext.Provider>
    )
}
