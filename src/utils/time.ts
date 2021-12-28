import moment from 'moment'
export type Momentish = moment.Moment | string | number

export function getTimestamp(): number{
  return Math.round(new Date().getTime() / 1000)
}

export function normalizeMomentish(momentish: Momentish): moment.Moment {
  const momentTime: moment.Moment = moment.isMoment(momentish) ? momentish : moment(momentish)

  if (!momentTime.isValid()) {
    throw Error(`Passed momentish '${momentish}' of type '${typeof momentish}' is not valid.`)
  }

  return momentTime
}
