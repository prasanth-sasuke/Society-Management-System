import { useState } from 'react';
import { Text } from 'react-native';
import { endpoints } from '../../../api/endpoints';
import { useSession } from '../../../auth/AuthContext';
import { Chips } from '../../../components/fields';
import { Attendance } from '../../../components/security/Attendance';
import { Handover } from '../../../components/security/Handover';
import { Incidents } from '../../../components/security/Incidents';
import { Patrol } from '../../../components/security/Patrol';
import { Card, Loading, Notice, Screen } from '../../../components/ui';
import { useApi } from '../../../hooks/useApi';
import { canWrite } from '../../../modules';
import { colors, type } from '../../../theme';

const SECTIONS = ['Attendance', 'Patrol', 'Handover', 'Incidents'];
const VIEWS = { Attendance, Patrol, Handover, Incidents };

export default function Security() {
  const { session } = useSession();
  const manage = canWrite(session.permissions, 'security');
  const { data, error, loading, refreshing, refresh, reload } = useApi(endpoints.security);
  const [section, setSection] = useState('Attendance');
  const [message, setMessage] = useState(null);

  const onDone = async (text) => {
    setMessage(text);
    await reload();
  };
  const onSection = (next) => {
    setMessage(null);
    setSection(next);
  };

  const SectionView = VIEWS[section];
  const onDuty = (data?.shifts || []).filter((s) => s.state === 'On duty');
  const next = (data?.shifts || []).find((s) => s.state === 'Next');

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      {error && !data ? <Notice>{error.message}</Notice> : null}
      {loading && !data ? <Loading label="Loading security…" /> : null}
      {data ? (
        <>
          <Card style={{ gap: 4 }}>
            <Text style={type.kicker}>Today · {data.today}</Text>
            {data.shifts.length === 0 ? (
              <Text style={type.body}>No shifts set up yet. Add them from the web app.</Text>
            ) : (
              <>
                <Text style={type.heading}>{onDuty.length ? `On duty: ${onDuty.map((s) => `${s.name} (${s.hours})`).join(', ')}` : 'No shift on duty right now'}</Text>
                {onDuty.map((s) => (s.staff !== '—' ? <Text key={s.id} style={type.small}>{s.name}: {s.staff}</Text> : null))}
                {next ? <Text style={type.small}>Next: {next.name} at {next.start}</Text> : null}
              </>
            )}
          </Card>
          <Chips options={SECTIONS} value={section} onChange={onSection} />
          {message ? <Notice tone="green">{message}</Notice> : null}
          {error ? <Notice>{error.message}</Notice> : null}
          <SectionView data={data} manage={manage} onDone={onDone} />
          {!manage ? <Text style={[type.small, { textAlign: 'center', color: colors.faint }]}>You can view security records but not change them.</Text> : null}
        </>
      ) : null}
    </Screen>
  );
}
