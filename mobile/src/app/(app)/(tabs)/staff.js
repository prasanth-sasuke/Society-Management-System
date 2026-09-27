import { useState } from 'react';
import { Text } from 'react-native';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Chips } from '../../../components/fields';
import { DailyAttendance } from '../../../components/staff/DailyAttendance';
import { FollowUps } from '../../../components/staff/FollowUps';
import { Register } from '../../../components/staff/Register';
import { Roster } from '../../../components/staff/Roster';
import { Loading, Notice, Screen } from '../../../components/ui';
import { isoDay } from '../../../format';
import { useApi } from '../../../hooks/useApi';
import { canWrite } from '../../../modules';
import { type } from '../../../theme';

const SECTIONS = ['Attendance', 'Staff', 'Roster', 'Follow-ups'];

export default function Staff() {
  const { session } = useSession();
  const manage = canWrite(session.permissions, 'staff');
  const [section, setSection] = useState('Attendance');
  const [date, setDate] = useState(isoDay());
  const [message, setMessage] = useState(null);

  const sheet = useApi(section === 'Attendance' ? endpoints.staffAttendanceFor(date) : null);
  const staff = useApi(section === 'Staff' ? endpoints.staff : null);
  const roster = useApi(section === 'Roster' ? endpoints.roster : null);
  const followUps = useApi(section === 'Follow-ups' ? endpoints.followUps : null);
  const current = { Attendance: sheet, Staff: staff, Roster: roster, 'Follow-ups': followUps }[section];

  const onDone = async (text) => {
    setMessage(text);
    await current.reload();
  };
  const onSection = (next) => {
    setMessage(null);
    setSection(next);
  };

  return (
    <Screen refreshing={current.refreshing} onRefresh={current.refresh}>
      <Chips options={SECTIONS} value={section} onChange={onSection} />
      {message ? <Notice tone="green">{message}</Notice> : null}
      {current.error ? <Notice>{current.error.message}</Notice> : null}

      {section === 'Attendance' ? (
        <DailyAttendance date={date} onDate={(d) => { setMessage(null); setDate(d); }} sheet={sheet.data} loading={sheet.loading} manage={manage} onDone={onDone} />
      ) : current.loading && !current.data ? (
        <Loading />
      ) : section === 'Staff' ? (
        <Register staff={staff.data || []} manage={manage} onDone={onDone} />
      ) : section === 'Roster' ? (
        <Roster roster={roster.data} />
      ) : (
        <FollowUps followUps={followUps.data || []} manage={manage} onDone={onDone} />
      )}

      {!manage ? <Text style={[type.small, { textAlign: 'center' }]}>You can view staff records but not change them.</Text> : null}
    </Screen>
  );
}
