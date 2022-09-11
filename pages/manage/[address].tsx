import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from '@ethersproject/units'
import { NextPage } from 'next'
import Head from 'next/head'
import {
    FormEventHandler,
    Fragment,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    APP_NAME,
    useAccount,
    getAddress,
    prefix,
    useProvider,
    BORROWER_SERVICE_URL,
    TOKEN_SYMBOL,
    rgbGreen,
    thirtyDays,
    oneDay,
    getInstallmentAmount,
    getBorrowerInfo,
    setBorrowerInfo,
    fetchBorrowerInfoAuthenticated,
    InputAmount,
    formatInputAmount,
    formatToken,
    zeroHex,
    zero,
    rgbYellowDarker,
    rgbYellowLighter,
} from '../../app'
import {
    Alert,
    AmountInput,
    BackToPools,
    Box,
    Button,
    EtherscanAddress,
    ExitAlert,
    formatDurationInMonths,
    Loans,
    Modal,
    Page,
    PageLoading,
    ScheduleSummary,
    Tabs,
    useAmountForm,
} from '../../components'
import {
    getBatchProviderAndLoanDeskContract,
    LoanApplicationStatus,
    loanDeskContract,
    Pool,
    refetchStatsIfUsed,
    trackTransaction,
    useManagerInfo,
    useSchedule,
    useStatsState,
} from '../../features'
import { useDispatch, useSelector } from '../../store'
import { Oval } from 'react-loading-icons'

const title = `Earn - ${APP_NAME}`

const Manage: NextPage<{ address: string }> = ({ address }) => {
    const pool = useSelector((s) => s.pools[address])
    const account = useAccount()

    const head = (
        <Head>
            <title>{title}</title>
            <link rel="icon" href={`${prefix}/favicon.svg`} />
        </Head>
    )

    if (!pool) return <PageLoading>{head}</PageLoading>

    return (
        <Page>
            {head}

            <BackToPools href="/manage" />
            <h1>{pool.name}</h1>
            {pool ? (
                pool.managerAddress === account ? (
                    <>
                        <StakeAndUnstake
                            pool={pool}
                            poolAddress={address}
                            account={account}
                        />
                        <LoansAwaitingApproval
                            pool={pool}
                            poolAddress={address}
                            account={account}
                        />
                        <Loans pool={pool} poolAddress={address} />
                    </>
                ) : (
                    <h3>Login with manager wallet</h3>
                )
            ) : (
                <h3>Loading…</h3>
            )}
        </Page>
    )
}

Manage.getInitialProps = (context) => {
    return { address: getAddress(context.query.address as string) }
}

export default Manage

const types = ['Stake', 'Unstake'] as const
function StakeAndUnstake({
    pool: { managerAddress, liquidityTokenAddress, liquidityTokenDecimals },
    poolAddress,
    account,
}: {
    pool: Pool
    poolAddress: string
    account: string
}) {
    const [type, setType] = useState<typeof types[number]>('Stake')

    const [stats] = useStatsState(poolAddress)
    const [info, refetchManagerInfo] = useManagerInfo(poolAddress)

    const max = useMemo(() => {
        if (type === 'Stake') return undefined

        if (info) return BigNumber.from(info.unstakable)

        return undefined
    }, [type, info])

    const isNotManager = managerAddress !== account

    const { form, value } = useAmountForm({
        type,
        onSumbit:
            type === 'Stake'
                ? (contract, amount) => contract.stake(amount)
                : (contract, amount) => contract.unstake(amount),
        refetch: () =>
            Promise.all([
                refetchManagerInfo(),
                refetchStatsIfUsed(poolAddress),
            ]),
        poolAddress,
        liquidityTokenAddress,
        liquidityTokenDecimals,
        disabled: Boolean(isNotManager),
        max,
    })

    return (
        <Box
            loading={Boolean(type === 'Unstake' && account ? !info : false)}
            overlay={isNotManager ? 'Only manager can stake' : undefined}
        >
            <Tabs tabs={types} currentTab={type} setCurrentTab={setType}></Tabs>

            {form}

            {type === 'Stake' ? (
                <Alert
                    style="warning-filled"
                    title="You should not stake unless you are prepared to sustain a total loss of the money you have invested plus any commission or other transaction charges"
                />
            ) : (
                <ExitAlert
                    value={value}
                    verb="unstaking"
                    feePercent={stats ? stats.exitFeePercent : 0}
                />
            )}
        </Box>
    )
}

interface BaseLoanRequest {
    id: string
    borrower: string
    amount: BigNumber // Will never change
    duration: BigNumber // Will never change
    name: string
    businessName: string
    status: LoanApplicationStatus
    profileId: string
    phone?: string
    email?: string
}
interface OfferValues {
    amount: BigNumber
    duration: BigNumber
    graceDefaultPeriod: number
    installmentAmount: BigNumber
    installments: number
    interest: number
}

type LoanRequest =
    | (BaseLoanRequest & {
          status: LoanApplicationStatus.APPLIED
      })
    | (BaseLoanRequest & {
          status: LoanApplicationStatus.DENIED
      })
    | (BaseLoanRequest &
          OfferValues & {
              status: LoanApplicationStatus.OFFER_MADE
          })
    | (BaseLoanRequest &
          OfferValues & {
              status: LoanApplicationStatus.OFFER_CANCELLED
          })
    | (BaseLoanRequest &
          OfferValues & {
              status: LoanApplicationStatus.OFFER_ACCEPTED
          })
function LoansAwaitingApproval({
    pool: { loanDeskAddress, liquidityTokenDecimals, block },
    poolAddress,
    account,
}: {
    pool: Pool
    poolAddress: string
    account: string
}) {
    const dispatch = useDispatch()
    const provider = useProvider()
    const [requests, setRequests] = useState<LoanRequest[] | null>(null)
    useEffect(() => {
        let canceled = false

        const contract = loanDeskContract
            .attach(loanDeskAddress)
            .connect(provider!)

        contract
            .queryFilter(contract.filters.LoanRequested(), block)
            .then((events) => {
                if (canceled) return []

                const { contract: attached } =
                    getBatchProviderAndLoanDeskContract(events.length, contract)

                return Promise.all(
                    events.map(({ data }) => attached.loanApplications(data)),
                )
            })
            .then((requests) => {
                if (canceled) return []

                return Promise.allSettled(
                    requests
                        .filter(
                            (request) =>
                                request.status ===
                                    LoanApplicationStatus.APPLIED ||
                                request.status ===
                                    LoanApplicationStatus.OFFER_MADE,
                        )
                        .map((request) =>
                            Promise.all([
                                getBorrowerInfo(request.profileId).then(
                                    (info) =>
                                        info
                                            ? info
                                            : fetch(
                                                  `${BORROWER_SERVICE_URL}/profile/${request.profileId}`,
                                              )
                                                  .then(
                                                      (response) =>
                                                          response.json() as Promise<{
                                                              name: string
                                                              businessName: string
                                                              phone?: string
                                                              email?: string
                                                          }>,
                                                  )
                                                  .then(
                                                      (info) => (
                                                          setBorrowerInfo(
                                                              request.profileId,
                                                              info,
                                                          ),
                                                          info
                                                      ),
                                                  ),
                                ),
                                request.status ===
                                LoanApplicationStatus.OFFER_MADE
                                    ? contract
                                          .loanOffers(request.id)
                                          .then((offer) => ({
                                              graceDefaultPeriod:
                                                  offer.gracePeriod.toNumber(),
                                              installmentAmount:
                                                  offer.installmentAmount,
                                              installments: offer.installments,
                                              interest: offer.apr,
                                              amount: offer.amount,
                                              duration: offer.duration,
                                          }))
                                    : undefined,
                            ]).then(
                                ([info, offer]: [
                                    {
                                        name: string
                                        businessName: string
                                        phone?: string
                                        email?: string
                                    },
                                    OfferValues | undefined,
                                ]) =>
                                    ({
                                        ...info,
                                        ...request,
                                        ...offer,
                                        id: request.id.toHexString(),
                                    } as LoanRequest),
                            ),
                        ),
                )
            })
            .then((results) => {
                if (canceled) return

                setRequests(
                    results
                        .filter((result) => result.status === 'fulfilled')
                        .map(
                            (result) =>
                                (result as PromiseFulfilledResult<LoanRequest>)
                                    .value,
                        ),
                )
            })
            .catch((error) => {
                console.error(error)
            })

        return () => {
            canceled = true

            setRequests(null)
        }
    }, [block, loanDeskAddress, provider])

    const [offerModalRequest, setOfferModalRequest] =
        useState<LoanRequest | null>(null)

    return (
        <>
            <Box>
                <h2>Loans awaiting approval</h2>
                <div className={requests === null ? undefined : 'grid'}>
                    {requests ? (
                        mapLoanRequest(
                            requests.filter(
                                (request) =>
                                    request.status ===
                                    LoanApplicationStatus.APPLIED,
                            ),
                            setOfferModalRequest,
                            liquidityTokenDecimals,
                        )
                    ) : (
                        <div className="loading">
                            <Oval
                                speed={0.7}
                                stroke={rgbGreen}
                                width={32}
                                height={32}
                            />
                        </div>
                    )}
                </div>
            </Box>

            <Box>
                <h2>Active offers</h2>
                <div className={requests === null ? undefined : 'grid'}>
                    {requests ? (
                        mapLoanRequest(
                            requests.filter(
                                (request) =>
                                    request.status ===
                                    LoanApplicationStatus.OFFER_MADE,
                            ),
                            setOfferModalRequest,
                            liquidityTokenDecimals,
                        )
                    ) : (
                        <div className="loading">
                            <Oval
                                speed={0.7}
                                stroke={rgbGreen}
                                width={32}
                                height={32}
                            />
                        </div>
                    )}
                </div>
            </Box>
            {offerModalRequest ? (
                <OfferModal
                    loan={offerModalRequest}
                    liquidityTokenDecimals={liquidityTokenDecimals}
                    onClose={() => setOfferModalRequest(null)}
                    onOffer={(
                        amount,
                        duration,
                        installmentAmount,
                        installments,
                        interest,
                        graceDefaultPeriod,
                    ) => {
                        const contract = loanDeskContract
                            .attach(loanDeskAddress)
                            .connect(provider!.getSigner())

                        const isOfferActive =
                            offerModalRequest.status ===
                            LoanApplicationStatus.OFFER_MADE

                        return (
                            isOfferActive
                                ? contract
                                      .updateOffer(
                                          offerModalRequest.id,
                                          amount,
                                          duration,
                                          graceDefaultPeriod,
                                          installmentAmount,
                                          installments,
                                          interest,
                                      )
                                      .then((tx) => ({
                                          tx,
                                          name: 'Update offer',
                                      }))
                                : contract
                                      .offerLoan(
                                          offerModalRequest.id,
                                          amount,
                                          duration,
                                          graceDefaultPeriod,
                                          installmentAmount,
                                          installments,
                                          interest,
                                      )
                                      .then((tx) => ({
                                          tx,
                                          name: `Offer a loan for ${formatToken(
                                              amount,
                                              liquidityTokenDecimals,
                                          )} ${TOKEN_SYMBOL}`,
                                      }))
                        )
                            .then(({ tx, name }) =>
                                trackTransaction(dispatch, { name, tx }),
                            )
                            .then(() => {
                                setOfferModalRequest(null)
                                setRequests(
                                    requests!.map((loan) =>
                                        loan === offerModalRequest
                                            ? {
                                                  ...loan,
                                                  status: LoanApplicationStatus.OFFER_MADE,
                                                  amount,
                                                  duration,
                                                  graceDefaultPeriod,
                                                  installmentAmount,
                                                  installments,
                                                  interest,
                                              }
                                            : loan,
                                    ),
                                )
                            })
                            .catch((error) => {
                                console.error(error)
                                throw error
                            })
                    }}
                    onReject={() => {
                        const contract = loanDeskContract
                            .attach(loanDeskAddress)
                            .connect(provider!.getSigner())

                        const isOfferActive =
                            offerModalRequest.status ===
                            LoanApplicationStatus.OFFER_MADE

                        return (
                            isOfferActive
                                ? contract
                                      .cancelLoan(offerModalRequest.id)
                                      .then((tx) => ({
                                          tx,
                                          name: 'Cancel loan',
                                          newStatus:
                                              LoanApplicationStatus.OFFER_CANCELLED,
                                      }))
                                : contract
                                      .denyLoan(offerModalRequest.id)
                                      .then((tx) => ({
                                          tx,
                                          name: 'Reject loan',
                                          newStatus:
                                              LoanApplicationStatus.DENIED,
                                      }))
                        )
                            .then(({ tx, name, newStatus }) =>
                                trackTransaction(dispatch, { name, tx }).then(
                                    () => newStatus,
                                ),
                            )
                            .then((newStatus) => {
                                setOfferModalRequest(null)
                                setRequests(
                                    requests!.map((loan) =>
                                        loan === offerModalRequest
                                            ? {
                                                  ...loan,
                                                  status: newStatus as any,
                                              }
                                            : loan,
                                    ),
                                )
                            })
                            .catch((error) => {
                                console.error(error)
                                throw error
                            })
                    }}
                    onFetchBorrowerInfo={async () => {
                        const info = await fetchBorrowerInfoAuthenticated(
                            account!,
                            provider!.getSigner(),
                            offerModalRequest.profileId,
                            poolAddress,
                        )
                        const newOffer = {
                            ...offerModalRequest,
                            phone: info.phone,
                            email: info.email,
                        }
                        setOfferModalRequest(newOffer)
                        setRequests(
                            requests!.map((request) =>
                                request === offerModalRequest
                                    ? newOffer
                                    : request,
                            ),
                        )
                    }}
                />
            ) : null}

            <style jsx>{`
                h2 {
                    font-size: 16px;
                    margin-top: 0;
                }

                .loading {
                    > :global(svg) {
                        display: block;
                        margin: 10px auto 0;
                    }
                }

                .grid {
                    display: grid;
                    grid-template-columns: 30% 50% 20%;
                    > :global(.name) {
                        > :global(span) {
                            color: ${rgbGreen};
                            cursor: pointer;
                        }
                    }
                }
            `}</style>
        </>
    )
}

function mapLoanRequest(
    loans: LoanRequest[],
    setOfferModalRequest: (loan: LoanRequest) => void,
    liquidityTokenDecimals: number,
) {
    return loans.map((loan) => (
        <Fragment key={loan.id}>
            <div className="name">
                <span onClick={() => setOfferModalRequest(loan)}>
                    {loan.name}
                </span>
            </div>
            <div className="description">
                <span>
                    {formatToken(loan.amount, liquidityTokenDecimals)}{' '}
                    {TOKEN_SYMBOL} for{' '}
                    {formatDurationInMonths(loan.duration.toNumber())} months
                </span>
            </div>
            <div className="address">
                <EtherscanAddress address={loan.borrower} />
            </div>
        </Fragment>
    ))
}

const initialInterest = 35
const initialInterestString = initialInterest.toString() as InputAmount
function OfferModal({
    loan,
    onClose,
    liquidityTokenDecimals,
    onOffer,
    onReject,
    onFetchBorrowerInfo,
}: {
    loan: LoanRequest
    liquidityTokenDecimals: number
    onClose(): void
    onOffer(
        amount: BigNumber,
        duration: BigNumber,
        installmentAmount: BigNumber,
        installments: number,
        interest: number,
        graceDefaultPeriod: number,
    ): Promise<void | object>
    onReject(): Promise<void>
    onFetchBorrowerInfo(): void
}) {
    const isOfferActive = loan.status === LoanApplicationStatus.OFFER_MADE

    const {
        initialAmount,
        initialMonths,
        initialInstallments,
        initialInstallmentAmount,
        initialInterestValue,
        initialGraceDefaultPeriod,
    } = useMemo(() => {
        const initialAmount = formatInputAmount(
            loan.amount,
            liquidityTokenDecimals,
        )
        const duration = loan.duration.toNumber()
        const initialMonthsNumber = formatDurationInMonths(duration)
        const initialMonths = initialMonthsNumber.toString() as InputAmount

        if (isOfferActive) {
            return {
                initialAmount,
                initialMonths,
                initialInstallments:
                    loan.installments.toString() as InputAmount,
                initialInstallmentAmount: formatInputAmount(
                    loan.installmentAmount,
                    liquidityTokenDecimals,
                ),
                initialInterestValue: (
                    loan.interest / 10
                ).toString() as InputAmount,
                initialGraceDefaultPeriod: (
                    loan.graceDefaultPeriod / oneDay
                ).toString() as InputAmount,
            }
        }

        const initialInstallments = Math.max(Math.ceil(initialMonthsNumber), 1)

        return {
            initialAmount,
            initialMonths,
            initialInstallments: initialInstallments.toString() as InputAmount,
            initialInstallmentAmount: formatInputAmount(
                getInstallmentAmount(
                    loan.amount,
                    initialInterest,
                    initialInstallments,
                    duration,
                ),
                liquidityTokenDecimals,
            ),
            initialInterestValue: initialInterestString,
            initialGraceDefaultPeriod: '35' as InputAmount,
        }
    }, [isOfferActive, liquidityTokenDecimals, loan])
    const [amount, setAmount] = useState<InputAmount>(initialAmount)
    const [duration, setDuration] = useState<InputAmount>(initialMonths)
    const [installments, setInstallments] =
        useState<InputAmount>(initialInstallments)
    const [installmentAmount, setInstallmentAmount] = useState<InputAmount>(
        initialInstallmentAmount,
    )
    const [interest, setInterest] = useState<InputAmount>(initialInterestValue)
    const [graceDefaultPeriod, setGraceDefaultPeriod] = useState<InputAmount>(
        initialGraceDefaultPeriod,
    )

    const [isOfferLoading, setIsOfferLoading] = useState(false)
    const [isRejectLoading, setIsRejectLoading] = useState(false)

    const [amountBigNumber, monthly, scheduleArg] = useMemo<
        [BigNumber, boolean, Parameters<typeof useSchedule>[0]]
    >(() => {
        const now = Math.trunc(Date.now() / 1000)

        if (
            !amount ||
            !duration ||
            !interest ||
            !installments ||
            !installmentAmount
        ) {
            return [zero, false, null]
        }

        const amountBigNumber = parseUnits(amount, liquidityTokenDecimals)

        const durationNumber = Number(duration)
        const installmentsNumber = parseInt(installments, 10)

        return [
            amountBigNumber,
            durationNumber % 1 === 0 && installmentsNumber === durationNumber,
            {
                amount: amountBigNumber,
                duration: Number(duration) * thirtyDays,
                apr: Number(interest),
                borrowedTime: now,
                installments: installmentsNumber,
                installmentAmount: parseUnits(
                    installmentAmount,
                    liquidityTokenDecimals,
                ),
                details: {
                    baseAmountRepaid: zeroHex,
                    totalAmountRepaid: zeroHex,
                    interestPaid: zeroHex,
                    interestPaidUntil: now,
                },
            },
        ]
    }, [
        amount,
        liquidityTokenDecimals,
        duration,
        interest,
        installments,
        installmentAmount,
    ])
    const schedule = useSchedule(scheduleArg)

    const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
        (event) => {
            event.preventDefault()
            setIsOfferLoading(true)
            onOffer(
                parseUnits(amount, liquidityTokenDecimals),
                BigNumber.from(Number(duration) * thirtyDays),
                parseUnits(installmentAmount, liquidityTokenDecimals),
                parseInt(installments, 10),
                Number(interest) * 10,
                Number(graceDefaultPeriod) * oneDay,
            ).catch(() => {
                setIsOfferLoading(false)
            })
        },
        [
            amount,
            duration,
            graceDefaultPeriod,
            installmentAmount,
            installments,
            interest,
            liquidityTokenDecimals,
            onOffer,
        ],
    )

    const handleReject = useCallback(() => {
        setIsRejectLoading(true)
        onReject().catch(() => {
            setIsRejectLoading(false)
        })
    }, [onReject])

    return (
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <h3>{isOfferActive ? 'Update Offer' : 'Offer a Loan'}</h3>

                <div className="field">
                    <div className="label">Account</div>
                    <div>
                        <EtherscanAddress address={loan.borrower} />
                    </div>
                </div>
                <div className="field">
                    <div className="label">Name</div>
                    <div>{loan.name}</div>
                </div>
                <div className="field">
                    <div className="label">Business Name</div>
                    <div>{loan.businessName}</div>
                </div>
                {loan.phone ? (
                    <div className="field">
                        <div className="label">Phone</div>
                        <div>
                            <a href={`tel:${loan.phone}`}>{loan.phone}</a>
                        </div>
                    </div>
                ) : null}
                {loan.email ? (
                    <div className="field">
                        <div className="label">Email</div>
                        <div>
                            <a href={`mailto:${loan.email}`}>{loan.email}</a>
                        </div>
                    </div>
                ) : null}
                {!loan.email && !loan.phone ? (
                    <Button
                        type="button"
                        stone
                        onClick={onFetchBorrowerInfo}
                        style={{ marginTop: 16 }}
                    >
                        Get contact information
                    </Button> // TODO: If auth is valid fetch automatically
                ) : null}
                <label>
                    <div className="label">Amount</div>
                    <AmountInput
                        decimals={liquidityTokenDecimals}
                        value={amount}
                        onChange={setAmount}
                        // disabled={disabled}
                        // onBlur={() =>
                        //     !checkAmountValidity(
                        //         amount,
                        //         liquidityTokenDecimals,
                        //         borrowInfo!.minLoanAmount,
                        //     ) && setDisplayAlert(true)
                        // }
                        // onKeyDown={(event) =>
                        //     event.key === 'Enter'
                        //         ? !checkAmountValidity(
                        //               amount,
                        //               liquidityTokenDecimals,
                        //               borrowInfo!.minLoanAmount,
                        //           ) && setDisplayAlert(true)
                        //         : undefined
                        // }
                    />
                </label>
                <label>
                    <div className="label">Duration</div>
                    <AmountInput
                        decimals={100}
                        value={duration}
                        onChange={setDuration}
                        // onBlur={showDisplayAlert}
                        // disabled={disabled}
                        noToken
                        label="months"
                        paddingRight={60}
                        // onKeyDown={(event) =>
                        //     event.key === 'Enter'
                        //         ? setDisplayAlert(true)
                        //         : undefined
                        // }
                    />
                </label>
                <label>
                    <div className="label">Installments</div>
                    <AmountInput
                        decimals={0}
                        value={installments}
                        onChange={setInstallments}
                        // onBlur={showDisplayAlert}
                        // disabled={disabled}
                        noToken
                        // onKeyDown={(event) =>
                        //     event.key === 'Enter'
                        //         ? setDisplayAlert(true)
                        //         : undefined
                        // }
                    />
                </label>
                <label>
                    <div className="label">Interest p/a</div>
                    <AmountInput
                        decimals={1}
                        value={interest}
                        onChange={setInterest}
                        // onBlur={showDisplayAlert}
                        // disabled={disabled}
                        noToken
                        label="%"
                        paddingRight={26}
                        // onKeyDown={(event) =>
                        //     event.key === 'Enter'
                        //         ? setDisplayAlert(true)
                        //         : undefined
                        // }
                    />
                </label>
                <label>
                    <div className="label">Installment amount</div>
                    <AmountInput
                        decimals={liquidityTokenDecimals}
                        value={installmentAmount}
                        onChange={setInstallmentAmount}
                        // onBlur={showDisplayAlert}
                        // disabled={disabled}
                        // onKeyDown={(event) =>
                        //     event.key === 'Enter'
                        //         ? setDisplayAlert(true)
                        //         : undefined
                        // }
                    />
                </label>
                <label>
                    <div className="label">Grace Default Period</div>
                    <AmountInput
                        decimals={2}
                        value={graceDefaultPeriod}
                        onChange={setGraceDefaultPeriod}
                        // onBlur={showDisplayAlert}
                        // disabled={disabled}
                        noToken
                        label="days"
                        paddingRight={44}
                        // onKeyDown={(event) =>
                        //     event.key === 'Enter'
                        //         ? setDisplayAlert(true)
                        //         : undefined
                        // }
                    />
                </label>

                <div className="schedule-container">
                    <ScheduleSummary
                        amount={amountBigNumber}
                        monthly={monthly}
                        schedule={schedule}
                        liquidityTokenDecimals={liquidityTokenDecimals}
                    />
                </div>

                {/* {displayAlert && alert ? (
            <div className="alert-positioner">
                <Alert style="error-filled" title={alert} />
            </div>
        ) : null} */}

                <div className="buttons">
                    <Button
                        disabled={isOfferLoading || isRejectLoading}
                        loading={isOfferLoading}
                        type="submit"
                    >
                        {isOfferActive ? 'Update Offer' : 'Offer Loan'}
                    </Button>
                    <Button
                        disabled={isOfferLoading || isRejectLoading}
                        loading={isRejectLoading}
                        onClick={handleReject}
                        type="button"
                        stone
                    >
                        {isOfferActive ? 'Cancel Offer' : 'Reject Application'}
                    </Button>
                </div>
                {/* Disabled elements prevent any click events to be fired resulting in inputs not being blurred */}
                {/* {account && disabledSubmit ? (
                        <div className="clickable" onClick={showDisplayAlert} />
                    ) : null} */}

                <style jsx>{`
                    form {
                        padding: 20px;

                        > h3 {
                            margin-top: 0;
                        }

                        > .field,
                        > label {
                            display: block;
                            margin-top: 16px;

                            > .label {
                                color: var(--color-secondary);
                                font-weight: 400;
                                margin-bottom: 8px;
                            }
                        }

                        > .buttons {
                            display: flex;

                            > :global(button) {
                                margin: 16px 8px 0 0;
                            }
                        }

                        > .schedule-container {
                            color: ${rgbYellowDarker};
                            background-color: ${rgbYellowLighter};
                            margin-top: 16px;
                            padding: 12px 16px;
                            border-radius: 8px;
                        }
                    }
                `}</style>
            </form>
        </Modal>
    )
}
