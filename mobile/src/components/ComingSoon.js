import { Text } from 'react-native';
import { Card, Screen } from './ui';
import { type } from '../theme';

export function ComingSoon({ title, points }) {
  return (
    <Screen>
      <Card>
        <Text style={type.kicker}>Coming in a later slice</Text>
        <Text style={type.heading}>{title}</Text>
        {points.map((point) => (
          <Text key={point} style={type.body}>• {point}</Text>
        ))}
        <Text style={type.small}>Until then, use the web app for this module.</Text>
      </Card>
    </Screen>
  );
}
