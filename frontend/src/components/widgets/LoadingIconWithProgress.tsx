import {Progress} from 'antd';
import type {Property} from 'csstype';

type Props = {
    percent?: number;
    rotateSpeedSeconds?: number;
    size?: number;
    strokeWidth?: number;
    trailColor?: string;
    display?: Property.Display;
};

export const LoadingIconWithProgress = (props: Props) => {
    const {percent = 25, rotateSpeedSeconds = 1, size = 32, strokeWidth = 7, trailColor = 'transparent', display = 'inline-flex'} = props;
    return (
        <Progress
            type="circle"
            trailColor={trailColor}
            percent={percent}
            strokeWidth={strokeWidth}
            size={size}
            style={{animation: getRotateAnimationStyleValue(rotateSpeedSeconds), display}}
            showInfo={false}
        />
    );
};

export const getRotateAnimationStyleValue = (rotateSpeedSeconds: number = 1) => {
    return `rotate ${rotateSpeedSeconds}s linear infinite`;
};
