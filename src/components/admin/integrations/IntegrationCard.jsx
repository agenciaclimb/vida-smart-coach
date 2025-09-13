import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

const IntegrationCard = ({ title, description, children, footer }) => (
  <Card className="shadow-lg border-slate-200 hover:shadow-xl transition-shadow duration-300">
    <CardHeader>
      <CardTitle className="text-2xl font-bold text-slate-800">{title}</CardTitle>
      <CardDescription className="text-slate-600">{description}</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
    {footer && <CardFooter>{footer}</CardFooter>}
  </Card>
);

export default IntegrationCard;