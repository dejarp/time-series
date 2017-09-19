import * as _ from 'lodash';
import * as CliTable from 'cli-table';
import * as CliClear from 'cli-clear';
import TimeSeries from './time-series';
import TimeSeriesPoint from './time-series-point';
import MovingWindow from './operators/moving-window';
import CollateBy from './operators/collate-by';

type ReportValues = {[key: string]: any};

function Report(timeSeries: {[key: string]: TimeSeries<any>}) : TimeSeries<ReportValues> {
    let columns = _.keys(timeSeries);
    return CollateBy(_.values(timeSeries), function() {
        return {
            d: arguments[0].d ,
            v: _.zipObject(columns, arguments)
        };
    });
}

function PrintReportToConsole(reportPoint: TimeSeriesPoint<ReportValues>) {
    let reportLine = _.reduce(reportPoint.v, (line, value, column) => {
        return `${line} ${value.v} |`
    }, `| ${reportPoint.d} |`);

    console.log(reportLine);
}

export default function ConsoleReport(timeSeries: {[key: string]: TimeSeries<any>}) {
    let maxRows = Math.floor((process.stdout.rows / 2) - 2);
    return MovingWindow(
        Report(timeSeries), maxRows
    )
    .map(window => {
        let table = new CliTable({
            head: _(timeSeries).keys().unshift('Date').value()
        });

        let rows = _.map(window.v, reportPoint => _(reportPoint.v).values().map('v').unshift(reportPoint.d.toString()).value())
        _.forEach(rows, row => table.push(row));

        return {
            d: window.d,
            v: table
        };
    });
}