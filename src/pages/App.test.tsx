import React from 'react';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, mount } from 'enzyme';
import App from "./App";

configure({adapter: new Adapter()});

describe('App Routing Test', () => {
    it('Should render settings page on homepage', () => {
        const page = mount((<App/>));

        const settingsMenuEntry = page.find('a').at(0);

        expect(settingsMenuEntry.hasClass('is-active'));
    });

    it('Should render filters page on /filters', () => {
        const page = mount((<App/>));

        const filtersMenuEntry = page.find('a').at(1);

        filtersMenuEntry.simulate('click');
        expect(filtersMenuEntry.hasClass('is-active'));
    });


    it('Should render settings page on /settings after page switch', () => {
        const page = mount((<App/>));

        const filtersMenuEntry = page.find('a').at(1);

        filtersMenuEntry.simulate('click');
        expect(filtersMenuEntry.hasClass('is-active'));

        const settingsMenuEntry = page.find('a').at(0);
        settingsMenuEntry.simulate('click');

        expect(settingsMenuEntry.hasClass('is-active'));
    });
});
