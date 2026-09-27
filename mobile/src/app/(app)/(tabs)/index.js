import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Card, Kpi, KpiGrid, Loading, Notice, Row, Screen } from '../../../components/ui';
import { greeting, plural, rupees } from '../../../format';
import { useApi } from '../../../hooks/useApi';
import { canRead } from '../../../modules';
import { colors, type } from '../../../theme';

export default function Home() {
  const { session } = useSession();
  const { user, permissions, scope } = session;
  const flatScoped = Boolean(scope && 'flat' in scope);
  const vendorScoped = Boolean(scope && 'vendor' in scope);

  const dashboard = useApi(endpoints.dashboard);
  const bills = useApi(flatScoped && canRead(permissions, 'billing') ? endpoints.bills : null);
  const tickets = useApi(canRead(permissions, 'helpdesk') ? endpoints.tickets : null);
  const sources = [dashboard, bills, tickets];

  const refreshing = sources.some((s) => s.refreshing);
  const refresh = () => Promise.all(sources.map((s) => s.refresh()));
  const firstLoad = sources.some((s) => s.loading && !s.data);
  const error = sources.find((s) => s.error && !s.data)?.error;

  const societyName = dashboard.data?.society?.name;
  const openTickets = (tickets.data || []).filter((t) => t.status !== 'Resolved');

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <View style={{ gap: 4 }}>
        <Text style={type.kicker}>{societyName || 'Society Operations Suite'}</Text>
        <Text style={type.title}>{greeting()}, {user.fullName.split(' ')[0]}</Text>
        <Text style={type.body}>Signed in as {user.roleLabel}. Pull down to refresh.</Text>
      </View>

      {error ? <Notice>{error.message}</Notice> : null}
      {firstLoad ? <Loading label="Loading your dashboard… the first load can take up to a minute." /> : null}

      {!firstLoad && flatScoped ? <ResidentSummary flat={scope.flat} bills={bills.data || []} openTickets={openTickets} showTickets={Boolean(tickets.data)} /> : null}
      {!firstLoad && vendorScoped ? <VendorSummary vendor={scope.vendor} openTickets={openTickets} /> : null}
      {!firstLoad && !flatScoped && !vendorScoped && dashboard.data ? <SocietySummary data={dashboard.data} /> : null}

      {!firstLoad && tickets.data ? (
        <Card>
          <Text style={type.heading}>{vendorScoped ? 'Tickets assigned to you' : flatScoped ? 'Your open complaints' : 'Open complaints'}</Text>
          {openTickets.length === 0 ? <Text style={type.body}>Nothing open right now.</Text> : null}
          {openTickets.slice(0, 5).map((t) => (
            <Row
              key={t.id}
              title={`${t.id} · ${t.category}`}
              subtitle={`${t.flat} — ${t.text}`}
              onPress={() => router.push({ pathname: '/ticket/[no]', params: { no: t.id } })}
              right={<Text style={{ color: t.priority === 'High' ? colors.rust : colors.faint, fontWeight: '600' }}>{t.priority}</Text>}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

function ResidentSummary({ flat, bills, openTickets, showTickets }) {
  if (!flat) {
    return <Notice>{"Your login isn't linked to a flat yet. Ask the society office to link it — until then you won't see any bills or complaints."}</Notice>;
  }
  const paid = bills.reduce((sum, b) => sum + Number(b.paidAmount || 0), 0);
  const owed = bills.reduce((sum, b) => sum + Number(b.remainingAmount || 0), 0);
  const unpaid = bills.filter((b) => Number(b.remainingAmount) > 0).length;
  const latest = bills[0];
  return (
    <>
      <KpiGrid>
        <Kpi label="Your flat" value={flat} />
        <Kpi label="You still owe" value={rupees(owed)} note={unpaid ? `${plural(unpaid, 'bill')} unpaid` : 'Nothing due'} tone={owed ? colors.rust : colors.green} />
        <Kpi label="You have paid" value={rupees(paid)} tone={colors.green} />
        {showTickets ? <Kpi label="Open complaints" value={String(openTickets.length)} /> : null}
      </KpiGrid>
      {latest ? (
        <Card>
          <Text style={type.heading}>Latest bill · {latest.period}</Text>
          <Text style={type.body}>Total {latest.total} · Due by {latest.dueOn}</Text>
          <Text style={[type.body, { color: Number(latest.remainingAmount) > 0 ? colors.rust : colors.green }]}>{latest.status}</Text>
        </Card>
      ) : null}
    </>
  );
}

function VendorSummary({ vendor, openTickets }) {
  if (!vendor) {
    return <Notice>{"Your login isn't linked to a vendor yet. Ask the society office to link it."}</Notice>;
  }
  return (
    <KpiGrid>
      <Kpi label="Vendor" value={vendor} />
      <Kpi label="Open tickets" value={String(openTickets.length)} tone={openTickets.length ? colors.rust : colors.green} />
    </KpiGrid>
  );
}

function SocietySummary({ data }) {
  const { money, occupancy } = data;
  const kpis = [];
  if (money) {
    kpis.push(
      { label: 'Money collected', value: rupees(money.collected), note: money.paidBills ? `${plural(money.paidBills, 'bill')} fully paid` : 'No collections yet', tone: colors.green },
      { label: 'Money still due', value: rupees(money.due), note: money.unpaidFlats ? `${plural(money.unpaidFlats, 'flat')} yet to pay` : 'No dues', tone: colors.rust },
      { label: 'Money spent', value: rupees(money.spent), note: money.vouchers ? plural(money.vouchers, 'approved voucher') : 'No expenses yet' },
    );
  }
  if (occupancy) {
    kpis.push({ label: 'Flats occupied', value: `${occupancy.occupied} / ${occupancy.total}`, note: occupancy.total ? `${plural(occupancy.vacant, 'flat')} empty` : 'No flats yet' });
  }
  if (data.overdueBills !== undefined) kpis.push({ label: 'Overdue bills', value: String(data.overdueBills), tone: data.overdueBills ? colors.rust : colors.text });
  if (data.openTickets !== undefined) kpis.push({ label: 'Open complaints', value: String(data.openTickets) });
  if (data.staffOnPayroll !== undefined) kpis.push({ label: 'Staff on payroll', value: String(data.staffOnPayroll) });
  if (data.vendors !== undefined) kpis.push({ label: 'Vendors', value: String(data.vendors) });

  if (!kpis.length) return <Notice tone="green">Your modules are in the tabs below.</Notice>;
  return (
    <KpiGrid>
      {kpis.map((k) => <Kpi key={k.label} {...k} />)}
    </KpiGrid>
  );
}
