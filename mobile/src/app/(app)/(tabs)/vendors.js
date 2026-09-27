import { useState } from 'react';
import { Text } from 'react-native';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Chips } from '../../../components/fields';
import { Loading, Notice, Screen } from '../../../components/ui';
import { Amc } from '../../../components/vendors/Amc';
import { Breakdowns } from '../../../components/vendors/Breakdowns';
import { AssetList, Reminders, VendorList } from '../../../components/vendors/Directory';
import { Invoices } from '../../../components/vendors/Invoices';
import { useApi } from '../../../hooks/useApi';
import { canWrite } from '../../../modules';
import { type } from '../../../theme';

const OFFICE_SECTIONS = ['Reminders', 'Invoices', 'AMC', 'Vendors', 'Assets', 'Breakdowns'];
const VENDOR_SECTIONS = ['Reminders', 'Invoices', 'AMC', 'Vendors'];

export default function Vendors() {
  const { session } = useSession();
  const vendorScoped = Boolean(session.scope && 'vendor' in session.scope);
  const manage = canWrite(session.permissions, 'vendors');
  const canPay = manage && canWrite(session.permissions, 'finance');
  const sections = vendorScoped ? VENDOR_SECTIONS : OFFICE_SECTIONS;
  const [section, setSection] = useState('Reminders');
  const [message, setMessage] = useState(null);

  const needs = (...names) => names.includes(section);
  const reminders = useApi(needs('Reminders') ? endpoints.reminders : null);
  const invoices = useApi(needs('Invoices') ? endpoints.invoices : null);
  const amc = useApi(needs('AMC') ? endpoints.amc : null);
  const vendors = useApi(needs('Invoices', 'AMC', 'Vendors') ? endpoints.vendors : null);
  const assets = useApi(needs('Assets', 'Breakdowns') ? endpoints.assets : null);
  const breakdowns = useApi(needs('Breakdowns') ? endpoints.breakdowns : null);

  const active = {
    Reminders: [reminders],
    Invoices: [invoices, vendors],
    AMC: [amc, vendors],
    Vendors: [vendors],
    Assets: [assets],
    Breakdowns: [breakdowns, assets],
  }[section];
  const main = active[0];
  const refreshing = active.some((s) => s.refreshing);
  const refresh = () => Promise.all(active.map((s) => s.refresh()));
  const onDone = async (text) => {
    setMessage(text);
    await Promise.all(active.map((s) => s.reload()));
  };
  const onSection = (next) => {
    setMessage(null);
    setSection(next);
  };
  const error = active.find((s) => s.error)?.error;

  let body = null;
  if (main.loading && !main.data) body = <Loading />;
  else if (section === 'Reminders') body = <Reminders reminders={reminders.data || []} />;
  else if (section === 'Invoices') body = <Invoices invoices={invoices.data || []} vendors={vendors.data || []} manage={manage} canPay={canPay} onDone={onDone} />;
  else if (section === 'AMC') body = <Amc amc={amc.data || []} vendors={vendors.data || []} manage={manage} onDone={onDone} />;
  else if (section === 'Vendors') body = <VendorList vendors={vendors.data || []} />;
  else if (section === 'Assets') body = <AssetList assets={assets.data || []} />;
  else body = <Breakdowns breakdowns={breakdowns.data || []} assets={assets.data || []} manage={manage} onDone={onDone} />;

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Chips options={sections} value={section} onChange={onSection} />
      {message ? <Notice tone="green">{message}</Notice> : null}
      {error ? <Notice>{error.message}</Notice> : null}
      {body}
      {!manage ? <Text style={[type.small, { textAlign: 'center' }]}>{vendorScoped ? 'Showing your contract records.' : 'You can view vendor records but not change them.'}</Text> : null}
    </Screen>
  );
}
